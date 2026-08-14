import paramiko
import os
import sys
import requests
import json

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

# 1. Obter clientes cadastrados no banco
pg = "PGPASSWORD='Relm@2026!Secure' PGHOST='localhost' PGPORT='5432' PGUSER='relm_user' PGDATABASE='relm_careplus_prod' psql -t -A -c"
cust_raw = run_ssh(f'{pg} "SELECT id, email, full_name FROM customers WHERE password_hash IS NOT NULL LIMIT 3"')
customers = [line.split('|') for line in cust_raw.strip().split('\n') if '|' in line]

BASE_URL = "http://177.153.62.248/api"

print("=" * 80)
print("=== AUDITORIA COMPLETA DE INTEGRAÇÃO DO PORTAL DO CLIENTE (E2E) ===")
print("=" * 80)

total_checks = 0
passed_checks = 0
failed_checks = 0

def check(name, success, details=""):
    global total_checks, passed_checks, failed_checks
    total_checks += 1
    if success:
        passed_checks += 1
        print(f"[OK  PASS] {name} {details}")
    else:
        failed_checks += 1
        print(f"[FAIL-ERR] {name} {details}")

for cust_id, cust_email, cust_name in customers:
    print(f"\n>> Testando Cliente: {cust_name} ({cust_email}) [ID: {cust_id}]")
    
    # Gerar token JWT para o cliente
    node_script = f"""
    const jwt = require('/var/www/relm-careplus-prod/backend/node_modules/jsonwebtoken');
    require('/var/www/relm-careplus-prod/backend/node_modules/dotenv').config({{ path: '/var/www/relm-careplus-prod/backend/.env' }});
    const secret = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET;
    const token = jwt.sign({{ sub: '{cust_id}', email: '{cust_email}', type: 'CUSTOMER' }}, secret, {{ expiresIn: '1d' }});
    console.log(token);
    """
    token = run_ssh(f"node -e \"{node_script}\"")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check 1: GET /customer-portal/me
    res_me = requests.get(f"{BASE_URL}/customer-portal/me", headers=headers)
    check(f"Perfil do Cliente ({cust_email})", res_me.status_code == 200, f"-> Status: {res_me.status_code}")
    
    # Check 2: GET /customer-portal/warranties
    res_war = requests.get(f"{BASE_URL}/customer-portal/warranties", headers=headers)
    check(f"Garantias vinculadas ({cust_email})", res_war.status_code == 200 and isinstance(res_war.json(), list), f"-> Retornou {len(res_war.json() if res_war.status_code == 200 else [])} garantias")
    
    # Check 3: GET /customer-portal/purchases
    res_pur = requests.get(f"{BASE_URL}/customer-portal/purchases", headers=headers)
    check(f"Compras/Vendas vinculadas ({cust_email})", res_pur.status_code == 200 and isinstance(res_pur.json(), list), f"-> Retornou {len(res_pur.json() if res_pur.status_code == 200 else [])} compras")
    
    # Check 4: GET /customer-portal/insurance-quotes
    res_quo = requests.get(f"{BASE_URL}/customer-portal/insurance-quotes", headers=headers)
    check(f"Cotações de Seguro ({cust_email})", res_quo.status_code == 200 and isinstance(res_quo.json(), list), f"-> Retornou {len(res_quo.json() if res_quo.status_code == 200 else [])} cotações")
    
    # Check 5: GET /customer-portal/insurance-policies
    res_pol = requests.get(f"{BASE_URL}/customer-portal/insurance-policies", headers=headers)
    check(f"Apólices de Seguro ({cust_email})", res_pol.status_code == 200 and isinstance(res_pol.json(), list), f"-> Retornou {len(res_pol.json() if res_pol.status_code == 200 else [])} apólices")
    
    # Check 6: GET /customer-portal/events
    res_ev = requests.get(f"{BASE_URL}/customer-portal/events", headers=headers)
    check(f"Meus Eventos ({cust_email})", res_ev.status_code == 200 and isinstance(res_ev.json(), list), f"-> Retornou {len(res_ev.json() if res_ev.status_code == 200 else [])} eventos")
    
    # Check 7: GET /customer-portal/benefits
    res_ben = requests.get(f"{BASE_URL}/customer-portal/benefits", headers=headers)
    check(f"Benefícios do Clube ({cust_email})", res_ben.status_code == 200 and isinstance(res_ben.json(), list), f"-> Retornou {len(res_ben.json() if res_ben.status_code == 200 else [])} benefícios")
    
    # Check 8: GET /customer-portal/referral
    res_ref = requests.get(f"{BASE_URL}/customer-portal/referral", headers=headers)
    check(f"Código de Indicação ({cust_email})", res_ref.status_code == 200 and "referralCode" in res_ref.json(), f"-> Código: {res_ref.json().get('referralCode') if res_ref.status_code == 200 else 'None'}")
    
    # Check 9: GET /v1/points/balance
    res_pts = requests.get(f"{BASE_URL}/v1/points/balance", headers=headers)
    check(f"Saldo de Pontos ({cust_email})", res_pts.status_code == 200 and "total" in res_pts.json(), f"-> Total: {res_pts.json().get('total') if res_pts.status_code == 200 else 'None'} pts")
    
    # Check 10: GET /v1/services/my-orders?customerId=...
    res_ord = requests.get(f"{BASE_URL}/v1/services/my-orders", params={"customerId": cust_id}, headers=headers)
    check(f"Ordens de Serviço Oficina ({cust_email})", res_ord.status_code == 200 and isinstance(res_ord.json(), list), f"-> Retornou {len(res_ord.json() if res_ord.status_code == 200 else [])} ordens")
    
    # Check 11: GET /v1/rewards/vouchers/my
    res_vouc = requests.get(f"{BASE_URL}/v1/rewards/vouchers/my", headers=headers)
    check(f"Vouchers de Recompensas ({cust_email})", res_vouc.status_code == 200 and isinstance(res_vouc.json(), list), f"-> Retornou {len(res_vouc.json() if res_vouc.status_code == 200 else [])} vouchers")

# 2. Testar Inscrição Pública com E-mail em Caixa Alta vs Baixa (Case-Insensitive Binding Test)
print("\n" + "=" * 80)
print("=== TESTANDO VINCULAÇÃO CASE-INSENSITIVE DE FORMULÁRIO PÚBLICO ===")
print("=" * 80)

# Criar cotação pública de seguro com email em caixa mista para o cliente Murilo
mixed_email = "MuFeRnAnDeS2811@gMaIl.CoM"
quote_payload = {
    "fullName": "MURILO DE LIMA FERNANDES QA",
    "email": mixed_email,
    "phone": "11999998888",
    "bikeValue": 15000,
    "city": "São Paulo",
    "state": "SP"
}
quote_res = requests.post(f"{BASE_URL}/public/insurance-quote", json=quote_payload)
check("Criação de Cotação Pública com Email Misto", quote_res.status_code in (200, 201), f"-> Status: {quote_res.status_code}")

# Verificar se a cotação criada com email misto aparece imediatamente no portal do cliente Murilo
murilo_id = 'a6a5752b-4298-4991-abaf-33a0296d25b2'
node_script_m = f"""
const jwt = require('/var/www/relm-careplus-prod/backend/node_modules/jsonwebtoken');
require('/var/www/relm-careplus-prod/backend/node_modules/dotenv').config({{ path: '/var/www/relm-careplus-prod/backend/.env' }});
const secret = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET;
const token = jwt.sign({{ sub: '{murilo_id}', email: 'mufernandes2811@gmail.com', type: 'CUSTOMER' }}, secret, {{ expiresIn: '1d' }});
console.log(token);
"""
token_m = run_ssh(f"node -e \"{node_script_m}\"")
headers_m = {"Authorization": f"Bearer {token_m}"}

quotes_m = requests.get(f"{BASE_URL}/customer-portal/insurance-quotes", headers=headers_m).json()
found_quote = any(q.get('bikeValue') == 15000 or q.get('bikeValue') == '15000' or float(q.get('bikeValue') or 0) == 15000 for q in quotes_m)
check("Cotação com Email Misto vinculada e visível em 'Minhas Cotações'", found_quote, f"-> Total de cotações de Murilo: {len(quotes_m)}")

print("\n" + "=" * 80)
print(f"RESULTADO FINAL DA AUDITORIA QA: {passed_checks}/{total_checks} CHECKS APROVADOS ({(passed_checks/total_checks)*100:.1f}%)")
print("=" * 80)
