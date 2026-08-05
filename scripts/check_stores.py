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

def query(sql):
    cmd = f"PGPASSWORD='Relm@2026!Secure' psql -h localhost -U relm_user -d relm_careplus_prod -c \"{sql}\""
    _, o, e = c.exec_command(cmd)
    return o.read().decode('utf-8')

print("=== STORES ===")
print(query("SELECT id, trade_name, city, state, active FROM stores;"))

print("=== STORE SERVICES (SERVICOS DA CASA TRI) ===")
print(query("SELECT ss.id, ss.store_id, ms.name, ms.category, ss.active FROM store_services ss JOIN master_services ms ON ms.id = ss.master_service_id;"))

print("=== PARTNERS (PARCEIROS EXCLUSIVOS / PARCERIAS) ===")
print(query("SELECT id, name, category, active FROM partners;"))

c.close()
