import paramiko, os, sys, time

HOST = '177.153.62.248'
PORT = 22
USER = 'root'
PASS = os.environ.get('RELM_VPS_PASS') or sys.exit('defina RELM_VPS_PASS')

LOCAL_BACKEND_DIST = r'c:\Users\BOSS\Desktop\Relm\Relm-Care\backend\dist'
REMOTE_BACKEND_DIST = '/var/www/relm-careplus-prod/backend/dist'

def run(c, cmd):
    _, so, se = c.exec_command(cmd)
    return so.read().decode('utf-8', 'replace'), se.read().decode('utf-8', 'replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=PASS)

print('1) Uploading compiled backend dist/...')
sftp = c.open_sftp()

def upload(local, remote):
    try:
        sftp.stat(remote)
    except FileNotFoundError:
        sftp.mkdir(remote)
    for it in os.listdir(local):
        lp = os.path.join(local, it)
        rp = remote + '/' + it
        if os.path.isdir(lp):
            upload(lp, rp)
        else:
            sftp.put(lp, rp)

upload(LOCAL_BACKEND_DIST, REMOTE_BACKEND_DIST)
out, err = run(c, 'pm2 restart all || systemctl restart relm-backend || true')
sys.stdout.buffer.write(('3) PM2 restart output:\n' + out + err + '\n').encode('utf-8', 'ignore'))

c.close()
sys.stdout.buffer.write(b'=== BACKEND DEPLOY CONCLUIDO ===\n')
