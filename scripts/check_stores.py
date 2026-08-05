import paramiko
import os

def _load_env_file(path):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line: continue
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

_load_env_file('.env')
PASS = os.environ.get('RELM_VPS_PASS')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('177.153.62.248', 22, 'root', PASS)

cmd = "PGPASSWORD='Relm@2026!Secure' psql -h localhost -U relm_user -d relm_careplus_prod -c 'SELECT id, trade_name, city, state, active FROM stores;'"
_, o, e = c.exec_command(cmd)
print("=== STORES EM PRODUCAO ===")
print(o.read().decode('utf-8'))
print(e.read().decode('utf-8'))
c.close()
