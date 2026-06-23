import paramiko, os, sys, time

HOST='177.153.62.248'; PORT=22; USER='root'; PASS='lXde@12#45'
LOCAL_DIST=r'c:\Users\BOSS\Desktop\Relm\Relm-Care\frontend\dist'
WEB='/var/www/relm-careplus-prod-web'

def run(c, cmd):
    _, so, se = c.exec_command(cmd)
    return so.read().decode('utf-8','replace'), se.read().decode('utf-8','replace')

c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)

# 0) checar logo no dist local
has_logo = os.path.exists(os.path.join(LOCAL_DIST,'logo-relm.png'))
sys.stdout.buffer.write(('dist local tem logo-relm.png: %s\n' % has_logo).encode())

# 1) backup do web dir atual
ts=time.strftime('%Y%m%d-%H%M%S')
bak='%s.backup-%s' % (WEB, ts)
out,err=run(c,'cp -a %s %s && echo BACKUP_OK %s' % (WEB, bak, bak))
sys.stdout.buffer.write(('1) backup: %s%s\n' % (out.strip(), err.strip())).encode())

# 2) limpar e enviar novo dist
run(c,'rm -rf %s/*' % WEB)
sftp=c.open_sftp()
def upload(local, remote):
    try: sftp.stat(remote)
    except FileNotFoundError: sftp.mkdir(remote)
    for it in os.listdir(local):
        lp=os.path.join(local,it); rp=remote+'/'+it
        if os.path.isdir(lp): upload(lp,rp)
        else:
            sftp.put(lp,rp); sys.stdout.buffer.write(('  -> %s\n'%rp).encode())
upload(LOCAL_DIST, WEB)
sftp.close()

# 3) permissoes
run(c,'chown -R www-data:www-data %s && chmod -R 755 %s' % (WEB, WEB))

# 4) verificar publicado
out,_=run(c,"cat %s/index.html | grep -oE 'assets/index-[A-Za-z0-9_-]+\\.js'" % WEB)
sys.stdout.buffer.write(('4) bundle publicado: %s' % out).encode())
out,_=run(c,"ls -la %s/logo-relm.png 2>&1 | tail -1" % WEB)
sys.stdout.buffer.write(('   logo no servidor: %s\n' % out.strip()).encode())

c.close()
sys.stdout.buffer.write(b'=== DEPLOY FRONTEND CONCLUIDO ===\n')
