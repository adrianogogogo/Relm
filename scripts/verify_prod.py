import urllib.request, urllib.error, json, sys

BASE = 'http://177.153.62.248/api'

def req(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header('Content-Type', 'application/json')
    if token:
        r.add_header('Authorization', 'Bearer ' + token)
    try:
        resp = urllib.request.urlopen(r, timeout=20)
        return resp.status, json.loads(resp.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or '{}')
        except Exception:
            return e.code, {}
    except Exception as e:
        return -1, {'err': str(e)}

out = []
def log(s): out.append(s); print(s)

# 1) Login admin
st, body = req('POST', '/auth/login', body={'email':'admin@relmbikes.com.br','password':'Admin@2024'})
token = body.get('access_token') or body.get('accessToken')
log('1) Login admin: HTTP %s, token=%s' % (st, 'OK' if token else 'FALHOU'))

# 2) Listar garantias e ver status
st, body = req('GET', '/warranty/claims', token=token)
if isinstance(body, list):
    claims = body
elif isinstance(body, dict):
    claims = body.get('data', [])
else:
    claims = []
log('2) GET /warranty/claims: HTTP %s, total=%s' % (st, len(claims) if isinstance(claims, list) else '?'))
status_count = {}
recebido_id = None
for c in (claims if isinstance(claims, list) else []):
    sstatus = c.get('status')
    status_count[sstatus] = status_count.get(sstatus, 0) + 1
    if sstatus == 'RECEBIDO' and not recebido_id:
        recebido_id = c.get('id')
log('   status distribution: %s' % status_count)

# 3) FSM: tentar APROVAR uma garantia em RECEBIDO -> deve dar 400 (FSM bloqueia)
if recebido_id:
    st, body = req('POST', '/warranty/claims/%s/approve' % recebido_id, token=token, body={'adminNotes':'verificacao automatica'})
    log('3) Aprovar garantia RECEBIDO (id=%s): HTTP %s -> %s' % (recebido_id, st, body.get('message','')))
    log('   ESPERADO: 400 (FSM bloqueia). Isso confirma que o frontend antigo nao consegue aprovar sem o botao Iniciar Analise.')
else:
    log('3) FSM: nenhuma garantia em RECEBIDO para testar (ok). status existentes: %s' % status_count)

# 4) Customers paginado (contrato novo)
st, body = req('GET', '/customers?page=1&pageSize=50', token=token)
has_shape = isinstance(body, dict) and 'data' in body and 'total' in body
log('4) GET /customers paginado: HTTP %s, contrato {data,total}=%s, total=%s' % (st, has_shape, body.get('total') if isinstance(body, dict) else '?'))

# 5) Guard de reports (admin deve acessar)
st, _ = req('GET', '/reports/dashboard-stats', token=token)
log('5) GET /reports/dashboard-stats (admin): HTTP %s (esperado 200)' % st)

# 6) Guard reports SEM token (deve 401)
st, _ = req('GET', '/reports/dashboard-stats')
log('6) GET /reports/dashboard-stats (sem token): HTTP %s (esperado 401)' % st)

# 7) Endpoint publico de garantia com body vazio -> validacao DTO (400, nao 500)
st, _ = req('POST', '/public/warranty', body={})
log('7) POST /public/warranty body vazio: HTTP %s (esperado 400 validacao, nao 500)' % st)

# 8) Login cliente
st, body = req('POST', '/customer-auth/login', body={'email':'joao.silva@example.com','password':'Cliente@2024'})
log('8) Login cliente: HTTP %s, token=%s' % (st, 'OK' if (body.get('access_token') or body.get('accessToken')) else 'FALHOU'))

print('\n=== FIM ===')
