import paramiko, os, sys, requests, json

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

def run(cmd):
    _, o, e = c.exec_command(cmd)
    return o.read().decode('utf-8', 'replace').strip()

# Gerar token para o cliente mufernandes2811@gmail.com diretamente usando o node na VPS
node_script = """
const jwt = require('/var/www/relm-careplus-prod/backend/node_modules/jsonwebtoken');
require('/var/www/relm-careplus-prod/backend/node_modules/dotenv').config({ path: '/var/www/relm-careplus-prod/backend/.env' });
const secret = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET;
const token = jwt.sign({ sub: 'a6a5752b-4298-4991-abaf-33a0296d25b2', email: 'mufernandes2811@gmail.com', type: 'CUSTOMER' }, secret, { expiresIn: '1d' });
console.log(token);
"""

token = run(f"node -e \"{node_script}\"")
print(f"Token gerado para mufernandes2811@gmail.com: {token[:25]}...")

headers = {"Authorization": f"Bearer {token}"}
BASE_URL = "http://177.153.62.248/api"

# 1. Testar GET /customer-portal/events
r = requests.get(f"{BASE_URL}/customer-portal/events", headers=headers)
print(f"GET /customer-portal/events: Status {r.status_code}")
events = r.json()
print(f"Total de eventos retornados para o cliente: {len(events)}")
for item in events:
    print(f" - [{item['id']}] {item['event']['title']} (Inscrito em: {item['createdAt']})")

# 2. Testar POST /customer-portal/events/:id/register
all_events = requests.get(f"{BASE_URL}/public/events").json()
print(f"\nTotal de eventos públicos: {len(all_events)}")
for ev in all_events:
    print(f" - Evento: {ev['title']} ({ev['id']})")

# Vamos tentar inscrever no evento 'Lançamento Nova Linha 2025' (id 4c3ac40e-ae37-4fae-8352-67812a068f69)
target_id = '4c3ac40e-ae37-4fae-8352-67812a068f69'
reg_res = requests.post(f"{BASE_URL}/customer-portal/events/{target_id}/register", headers=headers)
print(f"\nInscrição via /customer-portal/events/{target_id}/register: Status {reg_res.status_code}")
print(f"Resposta: {reg_res.text}")

# 3. Conferir se agora aparece em /customer-portal/events
r_after = requests.get(f"{BASE_URL}/customer-portal/events", headers=headers)
events_after = r_after.json()
print(f"\nTotal de eventos após nova inscrição: {len(events_after)}")
for item in events_after:
    print(f" - [{item['id']}] {item['event']['title']} (Inscrito em: {item['createdAt']})")
