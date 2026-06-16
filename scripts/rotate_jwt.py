import paramiko
import sys

HOST = '177.153.62.248'
PORT = 22
USER = 'root'
PASS = 'lXde@12#45'

BE = '/var/www/relm-careplus-prod/backend'

# Script remoto: rotaciona JWT_SECRET e JWT_REFRESH_SECRET usando secrets.token_urlsafe
# (evita problemas de escaping do sed). Nao imprime os valores.
REMOTE_PY = r'''
import secrets, shutil
path = "%s/.env.production"
targets = {"JWT_SECRET", "JWT_REFRESH_SECRET"}
rotated = {}
lines = open(path).read().splitlines()
out = []
for line in lines:
    if "=" in line and not line.lstrip().startswith("#"):
        k = line.split("=", 1)[0].strip()
        if k in targets:
            val = secrets.token_urlsafe(48)
            rotated[k] = len(val)
            out.append(k + "=\"" + val + "\"")
            continue
    out.append(line)
open(path, "w").write("\n".join(out) + "\n")
shutil.copyfile(path, "%s/.env")
for k in sorted(targets):
    print(k, "ROTATED len=" + str(rotated[k]) if k in rotated else "NOT_FOUND")
''' % (BE, BE)

def run(client, cmd):
    _, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=PORT, username=USER, password=PASS)

# 1) Rotacionar (escreve o script remoto e executa)
sftp = client.open_sftp()
with sftp.open('/root/rotate_jwt_tmp.py', 'w') as f:
    f.write(REMOTE_PY)
sftp.close()

out, err = run(client, 'python3 /root/rotate_jwt_tmp.py')
sys.stdout.buffer.write(('=== ROTACAO ===\n' + out + err).encode('utf-8'))

# Confirmar que ambas as chaves continuam presentes (1 ocorrencia cada)
out, _ = run(client, "grep -c '^JWT_SECRET=' %s/.env; grep -c '^JWT_REFRESH_SECRET=' %s/.env; diff -q %s/.env %s/.env.production && echo ENV_IDENTICOS" % (BE, BE, BE, BE))
sys.stdout.buffer.write(('=== CHECK ENV (esperado 1,1,ENV_IDENTICOS) ===\n' + out).encode('utf-8'))

# 2) Reload do PM2
out, err = run(client, 'pm2 reload relm-careplus-prod-backend && pm2 save')
sys.stdout.buffer.write(('=== PM2 RELOAD ===\n' + out[-400:] + err[-200:]).encode('utf-8'))

# Limpar arquivo temporario
run(client, 'shred -u /root/rotate_jwt_tmp.py 2>/dev/null || rm -f /root/rotate_jwt_tmp.py')

client.close()
sys.stdout.buffer.write(b'\n=== ROTACAO CONCLUIDA ===\n')
