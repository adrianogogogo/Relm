import urllib.request, urllib.error, json

BASE='http://177.153.62.248/api'
def req(method, path, token=None, body=None):
    data=json.dumps(body).encode() if body is not None else None
    r=urllib.request.Request(BASE+path, data=data, method=method)
    r.add_header('Content-Type','application/json')
    if token: r.add_header('Authorization','Bearer '+token)
    try:
        resp=urllib.request.urlopen(r, timeout=20)
        return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return -1, str(e)

# 1) admin login
st, b = req('POST','/auth/unified-login', body={'email':'admin@relmbikes.com.br','password':'Admin@2024'})
admin = json.loads(b).get('access_token')
print('1) admin login:', st)

# 2) cria distribuidor de teste
st, b = req('POST','/admin-users', token=admin, body={'name':'TESTE Distribuidor','email':'teste-dist@example.com','password':'TesteDist@2026','role':'DISTRIBUIDOR'})
print('2) cria distribuidor:', st)
uid=None
try: uid=json.loads(b).get('id')
except: pass

# 3) login distribuidor
st, b = req('POST','/auth/unified-login', body={'email':'teste-dist@example.com','password':'TesteDist@2026'})
dist = json.loads(b).get('access_token') if st in (200,201) else None
print('3) login distribuidor:', st, '| token:', 'OK' if dist else 'FALHOU')

if dist:
    st,_=req('GET','/stores', token=dist);                 print('   GET /stores (ver):           ', st, '(esperado 200)')
    st,_=req('GET','/customers', token=dist);              print('   GET /customers (BLOQUEAR):   ', st, '(esperado 403)')
    st,_=req('POST','/stores', token=dist, body={});       print('   POST /stores (criar):        ', st, '(esperado 400 valid., NAO 403)')
    st,_=req('PATCH','/stores/00000000-0000-0000-0000-000000000000', token=dist, body={}); print('   PATCH /stores/:id (editar):  ', st, '(esperado 400/404, NAO 403)')
    st,_=req('DELETE','/stores/00000000-0000-0000-0000-000000000000', token=dist); print('   DELETE /stores/:id (BLOQUEAR):', st, '(esperado 403)')
    st,_=req('GET','/reports/dashboard-stats', token=dist);print('   GET /reports (BLOQUEAR):     ', st, '(esperado 403)')

# 4) cleanup: remove distribuidor de teste
if uid:
    st,_=req('DELETE','/admin-users/'+uid, token=admin)
    print('4) remove distribuidor de teste:', st)
else:
    print('4) (sem id; remover manualmente teste-dist@example.com)')
