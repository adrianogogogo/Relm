import paramiko, os, sys, time

HOST='177.153.62.248'; PORT=22; USER='root'; PASS=os.environ.get('RELM_VPS_PASS') or sys.exit('defina RELM_VPS_PASS')
LOCAL_DIST=r'c:\Users\BOSS\Desktop\Relm\Relm-Care\frontend\dist'
WEB='/var/www/relm-careplus-prod-web'

def run(c, cmd):
    _, so, se = c.exec_command(cmd)
    return so.read().decode('utf-8','replace'), se.read().decode('utf-8','replace')

c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST,port=PORT,username=USER,password=PASS)

# bundle atual (antes) para comparar
out,_=run(c,"cat %s/index.html | grep -oE 'assets/index-[A-Za-z0-9_-]+\\.js'" % WEB)
sys.stdout.buffer.write(('bundle ANTES: %s' % out).encode())

# 1) backup
ts=time.strftime('%Y%m%d-%H%M%S')
bak='%s.backup-%s' % (WEB, ts)
out,err=run(c,'cp -a %s %s && echo OK' % (WEB, bak))
sys.stdout.buffer.write(('1) backup -> %s : %s%s\n' % (bak, out.strip(), err.strip())).encode())

# 2) enviar SOBREPONDO (preserva assets antigos p/ abas abertas nao quebrarem)
sftp=c.open_sftp()
def upload(local, remote):
    try: sftp.stat(remote)
    except FileNotFoundError: sftp.mkdir(remote)
    for it in os.listdir(local):
        lp=os.path.join(local,it); rp=remote+'/'+it
        if os.path.isdir(lp): upload(lp,rp)
        else: sftp.put(lp,rp)
upload(LOCAL_DIST, WEB)
sftp.close()
# poda: mantem os 16 assets mais recentes (cobre ~5-8 builds), evita acumulo
run(c, "cd %s/assets && ls -1t | tail -n +17 | xargs -r rm -f" % WEB)
sys.stdout.buffer.write(b'2) upload (overlay + poda) concluido\n')

# 3) permissoes
run(c,'chown -R www-data:www-data %s && chmod -R 755 %s' % (WEB, WEB))

# 4) verificar
out,_=run(c,"cat %s/index.html | grep -oE 'assets/index-[A-Za-z0-9_-]+\\.js'" % WEB)
sys.stdout.buffer.write(('3) bundle DEPOIS: %s' % out).encode())
out,_=run(c,"ls %s/logo-relm.png >/dev/null 2>&1 && echo LOGO_OK || echo LOGO_FALTANDO" % WEB)
sys.stdout.buffer.write(('   logo: %s' % out).encode())
c.close()
sys.stdout.buffer.write(b'=== DEPLOY DESIGN CONCLUIDO ===\n')
