"""Smoke tests pos-deploy (13 testes da secao 5 do plano)."""
from _ssh import conn, run

c = conn()
B = "http://127.0.0.1:3005"
NG = "http://127.0.0.1"

print("########## TESTE 1: Health enxuto ##########")
run(c, f"curl -s {B}/api/health")

print("\n########## TESTE 2: /docs fechado (404) ##########")
run(c, f"curl -s -o /dev/null -w 'http=%{{http_code}}\\n' {B}/docs")

print("\n########## TESTE 3: Login admin (seed: admin@relmbikes.com.br / Admin@2024) ##########")
run(c, f"""curl -s -o /tmp/admin_login.json -w 'http=%{{http_code}}\\n' -X POST {B}/api/auth/login -H 'Content-Type: application/json' -d '{{"email":"admin@relmbikes.com.br","password":"Admin@2024"}}'""")
run(c, "head -c 400 /tmp/admin_login.json; echo")
# Test invalid creds returns 401 (not 500)
run(c, f"""curl -s -o /dev/null -w 'invalid_creds_http=%{{http_code}}\\n' -X POST {B}/api/auth/login -H 'Content-Type: application/json' -d '{{"email":"nobody@example.com","password":"wrongpass"}}'""")

print("\n########## TESTE 4: Login cliente (POST /api/customer-auth/login) ##########")
run(c, f"""curl -s -o /tmp/cust_login.json -w 'http=%{{http_code}}\\n' -X POST {B}/api/customer-auth/login -H 'Content-Type: application/json' -d '{{"email":"nobody@example.com","password":"wrongpass"}}'""")
run(c, "head -c 300 /tmp/cust_login.json; echo")

print("\n########## TESTE 5: GET /api/customers paginado ##########")
# Without token -> expect 401
run(c, f"curl -s -o /dev/null -w 'no_token_http=%{{http_code}}\\n' '{B}/api/customers?page=1&pageSize=50'")
# With admin token if login succeeded
run(c, """TOKEN=$(python3 -c "import json,sys
try:
  d=json.load(open('/tmp/admin_login.json'))
  print(d.get('access_token') or d.get('accessToken') or d.get('token') or '')
except: print('')")
if [ -n "$TOKEN" ]; then
  echo "admin token obtido - testando contrato"
  curl -s -o /tmp/customers.json -w 'with_token_http=%{http_code}\n' 'http://127.0.0.1:3005/api/customers?page=1&pageSize=50' -H "Authorization: Bearer $TOKEN"
  python3 -c "import json; d=json.load(open('/tmp/customers.json')); print('keys:', sorted(d.keys())); print('total:', d.get('total'), 'page:', d.get('page'), 'pageSize:', d.get('pageSize'), 'data_len:', len(d.get('data',[])))"
else
  echo "SEM token admin (login falhou) - apenas validacao 401 sem token acima"
fi""")

print("\n########## TESTE 9: Rate limit (6 POSTs login -> 6o = 429) ##########")
run(c, f"""for i in $(seq 1 6); do
  code=$(curl -s -o /dev/null -w '%{{http_code}}' -X POST {B}/api/auth/login -H 'Content-Type: application/json' -d '{{"email":"rl@example.com","password":"x"}}')
  echo "POST #$i -> $code"
done""")

print("\n########## TESTE 10: Headers seguranca nginx ##########")
run(c, f"curl -sI {NG}/ | grep -iE 'x-frame|x-content|referrer'")

print("\n########## TESTE 11: Helmet (backend) ##########")
run(c, f"curl -sI {B}/api/health | grep -iE 'x-dns-prefetch|x-frame|x-content|x-download|cross-origin|x-permitted'")

print("\n########## TESTE 13: PM2 estavel ##########")
run(c, "pm2 jlist | python3 -c \"import json,sys; d=json.load(sys.stdin); [print(p['name'], 'pm_id='+str(p['pm_id']), p['pm2_env']['status'], 'restarts='+str(p['pm2_env']['restart_time'])) for p in d]\"")

print("\n########## EXTRA: site publico responde (nginx /) ##########")
run(c, f"curl -s -o /dev/null -w 'site_http=%{{http_code}}\\n' {NG}/")
run(c, f"curl -s {NG}/ | grep -o 'assets/index-[A-Za-z0-9_]*\\.js'")
run(c, f"curl -s -o /dev/null -w 'logo_http=%{{http_code}}\\n' {NG}/logo-relm.png")

c.close()
