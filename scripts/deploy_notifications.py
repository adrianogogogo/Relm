import paramiko, os, sys, time

HOST='177.153.62.248'; PORT=22; USER='root'; PASS=os.environ.get('RELM_VPS_PASS') or sys.exit('defina RELM_VPS_PASS')
ROOT=r'c:\Users\BOSS\Desktop\Relm\Relm-Care'
LOCAL_SRC=ROOT+r'\backend\src'
LOCAL_PRISMA=ROOT+r'\backend\prisma'
LOCAL_DIST=ROOT+r'\frontend\dist'
BE='/var/www/relm-careplus-prod/backend'
WEB='/var/www/relm-careplus-prod-web'

def run(c, cmd, t=300):
    i,o,e=c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8','replace'), e.read().decode('utf-8','replace')

c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)
sftp=c.open_sftp()
def upload(local, remote):
    try: sftp.stat(remote)
    except FileNotFoundError: sftp.mkdir(remote)
    for it in os.listdir(local):
        lp=os.path.join(local,it); rp=remote+'/'+it
        if os.path.isdir(lp): upload(lp,rp)
        else: sftp.put(lp,rp)

# 1) backup
ts=time.strftime('%Y%m%d-%H%M%S'); bak='/root/relm-backups/%s'%ts
run(c,'mkdir -p %s'%bak)
out,err=run(c,'cp -a %s/dist %s/backend-dist.bak && cp -a %s/.env %s/env.bak && cp -a %s %s.backup-%s && echo OK'%(BE,bak,BE,bak,WEB,WEB,ts))
sys.stdout.buffer.write(('1) backup -> %s : %s%s\n'%(bak,out.strip(),err.strip())).encode())

# 2) upload backend src + prisma
upload(LOCAL_SRC, BE+'/src')
upload(LOCAL_PRISMA, BE+'/prisma')
sys.stdout.buffer.write(b'2) upload backend src+prisma OK\n')

# 3) prisma generate + migrate status + migrate deploy
out,err=run(c,'cd %s && NODE_ENV=production npx prisma migrate status 2>&1 | tail -8'%BE)
sys.stdout.buffer.write(('3a) migrate status:\n'+out+err).encode())
out,err=run(c,'cd %s && NODE_ENV=production npx prisma generate 2>&1 | tail -1 && NODE_ENV=production npx prisma migrate deploy 2>&1 | tail -8'%BE)
sys.stdout.buffer.write(('3b) generate+migrate deploy:\n'+out+err).encode())

# 4) confirma tabela notifications
out,_=run(c,'cd %s && grep -oE "DATABASE_URL=\\"[^\\"]+\\"" .env | head -1 >/dev/null; echo check'%BE)
out,_=run(c,"""psql "$(grep -oE 'postgresql://[^"]+' %s/.env | head -1)" -tAc "SELECT to_regclass('public.notifications');" 2>&1 | head -1"""%BE)
sys.stdout.buffer.write(('4) tabela notifications: %s'%out).encode())

# 5) nest build + reload
out,err=run(c,'cd %s && npm run build 2>&1 | tail -3'%BE)
sys.stdout.buffer.write(('5) nest build:\n'+out+err).encode())
out,err=run(c,'pm2 reload relm-careplus-prod-backend && pm2 save 2>&1 | tail -1')
sys.stdout.buffer.write(('6) pm2 reload:\n'+out[-250:]+err[-120:]+'\n').encode())

# 7) frontend (SOBREPONDO: preserva assets antigos p/ abas abertas nao quebrarem)
upload(LOCAL_DIST, WEB)
run(c,'chown -R www-data:www-data %s && chmod -R 755 %s'%(WEB,WEB))
# poda: mantem os 16 assets mais recentes
run(c,"cd %s/assets && ls -1t | tail -n +17 | xargs -r rm -f"%WEB)
out,_=run(c,"cat %s/index.html | grep -oE 'assets/index-[A-Za-z0-9_-]+\\.js'"%WEB)
sys.stdout.buffer.write(('7) frontend publicado: %s'%out).encode())

sftp.close(); c.close()
sys.stdout.buffer.write(b'=== DEPLOY NOTIFICACOES CONCLUIDO ===\n')
