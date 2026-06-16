"""Smoke tests complementares: login cliente valido, CORS, warranty validacao DTO."""
from _ssh import conn, run

c = conn()
B = "http://127.0.0.1:3005"
NG = "http://127.0.0.1"

print("########## TESTE 4 (valido): Login cliente seed joao.silva ##########")
run(c, f"""curl -s -o /tmp/cust_ok.json -w 'http=%{{http_code}}\\n' -X POST {B}/api/customer-auth/login -H 'Content-Type: application/json' -d '{{"email":"joao.silva@example.com","password":"Cliente@2024"}}'""")
run(c, "python3 -c \"import json; d=json.load(open('/tmp/cust_ok.json')); print('keys:', sorted(d.keys()))\" 2>/dev/null || head -c 200 /tmp/cust_ok.json")

print("\n########## TESTE 8: CORS preflight (Origin http://177.153.62.248) ##########")
run(c, f"""curl -s -i -X OPTIONS {B}/api/auth/login \
  -H 'Origin: http://177.153.62.248' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' | grep -iE 'access-control-allow|HTTP/'""")
print("--- Origin nao autorizado (deve NAO refletir o origin) ---")
run(c, f"""curl -s -i -X OPTIONS {B}/api/auth/login \
  -H 'Origin: http://evil.example.com' \
  -H 'Access-Control-Request-Method: POST' | grep -iE 'access-control-allow-origin' || echo '(sem allow-origin para origem nao autorizada - bom)'""")

print("\n########## TESTE 6: Warranty publico - validacao de DTO (body vazio -> 400, nao 500) ##########")
run(c, f"""curl -s -o /tmp/war.json -w 'empty_body_http=%{{http_code}}\\n' -X POST {B}/api/public/warranty -H 'Content-Type: application/json' -d '{{}}'""")
run(c, "head -c 250 /tmp/war.json; echo")

print("\n########## EXTRA: site publico via IP externo ##########")
run(c, f"curl -s -o /dev/null -w 'external_site_http=%{{http_code}}\\n' http://177.153.62.248/")
run(c, f"curl -s -o /dev/null -w 'external_health_http=%{{http_code}}\\n' http://177.153.62.248/api/health")
c.close()
