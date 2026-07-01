import paramiko, os, sys, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Mesmo padrao dos demais scripts de deploy (prod via SSH).
HOST='177.153.62.248'; PORT=22; USER='root'; PASS=os.environ.get('RELM_VPS_PASS') or sys.exit('defina RELM_VPS_PASS')
ROOT=r'c:\Users\BOSS\Desktop\Relm\Relm-Care'
LOCAL_SRC=ROOT+r'\backend\src'
LOCAL_PRISMA=ROOT+r'\backend\prisma'
LOCAL_DIST=ROOT+r'\frontend\dist'
BE='/var/www/relm-careplus-prod/backend'
WEB='/var/www/relm-careplus-prod-web'

def run(c, cmd, t=600):
    _, o, e = c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8','replace'), e.read().decode('utf-8','replace')

c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASS)

sftp=c.open_sftp()
def upload(local, remote):
    try: sftp.stat(remote)
    except FileNotFoundError: sftp.mkdir(remote)
    for it in os.listdir(local):
        lp=os.path.join(local,it); rp=remote+'/'+it
        if os.path.isdir(lp): upload(lp,rp)
        else: sftp.put(lp,rp)

# 1) Backup (dist + .env), igual aos outros deploys.
ts=time.strftime('%Y%m%d-%H%M%S')
bak='/root/relm-backups/%s' % ts
run(c,'mkdir -p %s' % bak)
out,err=run(c,'cp -a %s/dist %s/backend-dist.bak 2>/dev/null; cp -a %s/.env* %s/ 2>/dev/null; echo OK' % (BE,bak,BE,bak))
print('1) backup ->', bak, ':', out.strip(), err.strip())

# 2) Upload backend src + prisma (schema + migrations novas).
upload(LOCAL_SRC, BE+'/src')
upload(LOCAL_PRISMA, BE+'/prisma')
print('2) upload backend src+prisma OK')

# 3) Migrations: status, generate, deploy.
out,err=run(c,'cd %s && NODE_ENV=production npx prisma migrate status 2>&1 | tail -12'%BE)
print('3a) migrate status:\n'+out+err)
out,err=run(c,'cd %s && NODE_ENV=production npx prisma generate 2>&1 | tail -1 && NODE_ENV=production npx prisma migrate deploy 2>&1 | tail -12'%BE)
print('3b) generate+migrate deploy:\n'+out+err)

# 4) Pasta de uploads (anexos) — persistente, gravavel pelo processo.
out,err=run(c,'mkdir -p %s/uploads/warranty && ls -ld %s/uploads %s/uploads/warranty'%(BE,BE,BE))
print('4) uploads dir:\n'+out+err)

# 5) Build backend + pm2 reload.
out,err=run(c,'cd %s && npm run build 2>&1 | tail -4'%BE)
print('5a) build backend:\n'+out+err)
out,err=run(c,'pm2 reload relm-careplus-prod-backend && pm2 save 2>&1 | tail -1')
print('5b) pm2 reload:\n'+out[-300:]+err[-150:])

# 6) Frontend: publica o dist ja buildado localmente.
bakw='%s.backup-%s' % (WEB, ts)
out,err=run(c,'cp -a %s %s && echo BACKUP_OK'%(WEB,bakw))
print('6a) backup web:', out.strip(), err.strip())
run(c,'rm -rf %s/*'%WEB)
upload(LOCAL_DIST, WEB)
run(c,'chown -R www-data:www-data %s && chmod -R 755 %s'%(WEB,WEB))
out,_=run(c,"cat %s/index.html | grep -oE 'assets/index-[A-Za-z0-9_-]+\\.js'"%WEB)
print('6b) bundle publicado:', out.strip())

sftp.close()
c.close()
print('=== DEPLOY (resumo de garantia, ondas 1-4) CONCLUIDO ===')
