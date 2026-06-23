import paramiko
import sys

HOST = '177.153.62.248'
PORT = 22
USER = 'root'
PASS = 'lXde@12#45'

BE = '/var/www/relm-careplus-prod/backend'
BACKUP = '/root/relm-backups/20260615-235926/env.production.bak'

REMOTE_PY = r'''
def parse(path):
    d = {}
    try:
        for line in open(path):
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                d[k.strip()] = v.strip().strip('"').strip("'")
    except Exception as e:
        return {"__error__": str(e)}
    return d

old = parse("%s")
new = parse("%s")

def fp(v):
    if v is None:
        return "(AUSENTE)"
    if len(v) <= 12:
        return v + " (len=" + str(len(v)) + ")"
    return v[:6] + "..." + v[-4:] + " (len=" + str(len(v)) + ")"

keys = ["JWT_SECRET", "JWT_REFRESH_SECRET", "CUSTOMER_JWT_SECRET", "JWT_EXPIRES_IN", "JWT_REFRESH_EXPIRES_IN", "CORS_ORIGIN", "DATABASE_URL"]
for k in keys:
    ov = old.get(k)
    nv = new.get(k)
    print(k)
    print("  ANTIGO: " + fp(ov))
    print("  NOVO  : " + fp(nv))
    print("  MUDOU : " + ("SIM" if ov != nv else "nao"))
''' % (BACKUP, BE + '/.env.production')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS)

sftp = client.open_sftp()
with sftp.open('/root/secret_diff_tmp.py', 'w') as f:
    f.write(REMOTE_PY)
sftp.close()

_, stdout, stderr = client.exec_command('python3 /root/secret_diff_tmp.py')
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
sys.stdout.buffer.write((out + err).encode('utf-8'))

client.exec_command('rm -f /root/secret_diff_tmp.py')
client.close()
