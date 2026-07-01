import paramiko, os, sys, time

HOST='177.153.62.248'; PORT=22; USER='root'; PASS=os.environ.get('RELM_VPS_PASS') or sys.exit('defina RELM_VPS_PASS')
LOCAL_SRC=r'c:\Users\BOSS\Desktop\Relm\Relm-Care\backend\src'
BE='/var/www/relm-careplus-prod/backend'

def run(c, cmd, t=300):
    i,o,e=c.exec_command(cmd, timeout=t)
    return o.read().decode('utf-8','replace'), e.read().decode('utf-8','replace')

c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)

ts=time.strftime('%Y%m%d-%H%M%S')
bak='/root/relm-backups/%s' % ts
run(c,'mkdir -p %s' % bak)
out,err=run(c,'cp -a %s/dist %s/backend-dist.bak && cp -a %s/.env %s/env.bak && echo OK' % (BE,bak,BE,bak))
sys.stdout.buffer.write(('1) backup -> %s : %s%s\n' % (bak,out.strip(),err.strip())).encode())

# upload backend/src completo (sincroniza os arquivos de auth alterados)
sftp=c.open_sftp()
def upload(local, remote):
    try: sftp.stat(remote)
    except FileNotFoundError: sftp.mkdir(remote)
    for it in os.listdir(local):
        lp=os.path.join(local,it); rp=remote+'/'+it
        if os.path.isdir(lp): upload(lp,rp)
        else: sftp.put(lp,rp)
upload(LOCAL_SRC, BE+'/src')
sftp.close()
sys.stdout.buffer.write(b'2) upload backend/src concluido\n')

# prisma generate + nest build
out,err=run(c,'cd %s && NODE_ENV=production npx prisma generate 2>&1 | tail -2 && npm run build 2>&1 | tail -4' % BE)
sys.stdout.buffer.write(('3) build:\n'+out+err).encode())

# confirma unified-login no dist novo
out,_=run(c,'grep -rl "unified-login" %s/dist >/dev/null 2>&1 && echo UNIFIED_OK || echo UNIFIED_FALTANDO' % BE)
sys.stdout.buffer.write(('4) dist tem unified-login: '+out).encode())

# reload PM2
out,err=run(c,'pm2 reload relm-careplus-prod-backend && pm2 save 2>&1 | tail -1')
sys.stdout.buffer.write(('5) pm2 reload:\n'+out[-300:]+err[-150:]+'\n').encode())

c.close()
sys.stdout.buffer.write(b'=== DEPLOY BACKEND CONCLUIDO ===\n')
