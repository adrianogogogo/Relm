import paramiko
import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def _load_env_file(path):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

_load_env_file(r'c:\Users\BOSS\Desktop\Relm\Relm-Care\.env')
PASS = os.environ.get('RELM_VPS_PASS')
c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('177.153.62.248', port=22, username='root', password=PASS)

def run_ssh(cmd):
    _, o, e = c.exec_command(cmd)
    return o.read().decode('utf-8', 'replace').strip()

pg = "PGPASSWORD='Relm@2026!Secure' PGHOST='localhost' PGPORT='5432' PGUSER='relm_user' PGDATABASE='relm_careplus_prod' psql -c"
out = run_ssh(f'{pg} "SELECT id, title, start_at, end_at, active FROM events ORDER BY start_at ASC;"')
print("=== STATUS DOS EVENTOS NO BANCO DE PRODUÇÃO ===")
print(out)
