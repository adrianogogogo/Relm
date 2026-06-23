import urllib.request, urllib.error, json, paramiko

BASE='http://177.153.62.248/api'
def req(method, path, token=None, body=None):
    data=json.dumps(body).encode() if body is not None else None
    r=urllib.request.Request(BASE+path, data=data, method=method)
    r.add_header('Content-Type','application/json')
    if token: r.add_header('Authorization','Bearer '+token)
    try:
        resp=urllib.request.urlopen(r, timeout=25)
        return resp.status, json.loads(resp.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode() or '{}')
        except: return e.code, {}

st,b=req('POST','/auth/unified-login',body={'email':'admin@relmbikes.com.br','password':'Admin@2024'})
admin=b.get('access_token'); print('1) admin login:', st)

# cliente existente
st,b=req('GET','/customers?search=joao&pageSize=1',token=admin)
custs=b.get('data',b) if isinstance(b,dict) else b
cid=custs[0]['id'] if custs else None
print('2) cliente:', cid)

# cria garantia de teste
st,b=req('POST','/warranty/claims',token=admin,body={
  'customerId':cid,'serialNumber':'SN-AUDIT-TEST','model':'Bike Audit','productType':'Bicicleta',
  'invoiceNumber':'NF-AUDIT','purchaseStoreName':'Loja Audit'})
claim_id=b.get('id'); proto=b.get('protocol_number')
print('3) cria garantia:', st, '| id:', claim_id, '| proto:', proto)

# muda status RECEBIDO -> EM_ANALISE
st,b=req('PATCH', f'/warranty/claims/{claim_id}/status', token=admin, body={'to_status':'EM_ANALISE'})
print('4) muda status -> EM_ANALISE:', st)

# verifica audit log
st,b=req('GET','/audit-logs?entity=warranty', token=admin)
logs=b.get('logs',[])
found=[l for l in logs if l.get('entityId')==claim_id]
print('5) audit logs encontrados p/ a garantia:', len(found))
for l in found[:3]:
    print('   -', l.get('action'), '| meta:', json.dumps(l.get('metadata'), ensure_ascii=False))

# cleanup via SQL
c=paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('177.153.62.248',username='root',password='lXde@12#45')
sql=("DELETE FROM audit_logs WHERE entity_id='%s';"
     "DELETE FROM warranty_events WHERE claim_id='%s';"
     "DELETE FROM warranty_claims WHERE id='%s';"
     "DELETE FROM products WHERE serial_number='SN-AUDIT-TEST';" % (claim_id,claim_id,claim_id))
i,o,e=c.exec_command("sudo -u postgres psql -d relm_careplus_prod -c \"%s\"" % sql, timeout=60)
print('6) cleanup:', o.read().decode('utf-8','replace').replace(chr(10),' '))
err=e.read().decode('utf-8','replace')
if err.strip(): print('   cleanup stderr:', err[:300])
c.close()
