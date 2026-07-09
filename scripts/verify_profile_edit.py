import urllib.request, urllib.error, json, sys

BASE = 'http://localhost:3003/api' # Porta local de dev com prefixo /api

def req(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header('Content-Type', 'application/json')
    if token:
        r.add_header('Authorization', 'Bearer ' + token)
    try:
        resp = urllib.request.urlopen(r, timeout=10)
        return resp.status, json.loads(resp.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or '{}')
        except Exception:
            return e.code, {}
    except Exception as e:
        return -1, {'err': str(e)}

print("=== INICIANDO TESTES DE ALTERAÇÃO DE PERFIL E SENHA ===")

# 1) Login inicial
st, body = req('POST', '/customer-auth/login', body={'email':'joao.silva@example.com','password':'Cliente@2024'})
token = body.get('access_token') or body.get('accessToken')
if not token:
    print(f"ERRO: login inicial falhou (HTTP {st}): {body}")
    sys.exit(1)
print("1) Login inicial do cliente: OK")

# 2) Get profile atual
st, profile = req('GET', '/customer-portal/me', token=token)
print(f"2) Perfil atual carregado: {profile.get('fullName')} / Telefone: {profile.get('phone')}")

# 3) Update profile (muda o telefone temporariamente)
original_phone = profile.get('phone', '')
new_phone = '11999998888' if original_phone != '11999998888' else '11988887777'

st, updated = req('PUT', '/customer-portal/profile', token=token, body={
    'fullName': profile.get('fullName'),
    'phone': new_phone,
    'address': 'Rua Teste, 123',
    'city': 'São Paulo',
    'state': 'SP',
    'zipCode': '01001-000'
})
print(f"3) Atualização de perfil: HTTP {st}, novo telefone retornado: {updated.get('phone')}")
if updated.get('phone') != new_phone:
    print("ERRO: telefone atualizado não confere")
    sys.exit(1)

# Restaurar telefone original
req('PUT', '/customer-portal/profile', token=token, body={
    'fullName': profile.get('fullName'),
    'phone': original_phone
})

# 4) Alteração de senha
print("4) Alterando senha...")
st, pwd_resp = req('PUT', '/customer-portal/password', token=token, body={
    'oldPassword': 'Cliente@2024',
    'newPassword': 'NovaSenha@2026'
})
print(f"   Resposta alteração: HTTP {st} -> {pwd_resp}")
if st != 200:
    print("ERRO: falha ao alterar senha")
    sys.exit(1)

# 5) Testar login com senha antiga (deve falhar)
st, body_old = req('POST', '/customer-auth/login', body={'email':'joao.silva@example.com','password':'Cliente@2024'})
print(f"5) Login com senha antiga: HTTP {st} (esperado 401)")
if st != 401:
    print("ERRO: login com senha antiga deveria ter falhado!")
    sys.exit(1)

# 6) Testar login com nova senha (deve funcionar)
st, body_new = req('POST', '/customer-auth/login', body={'email':'joao.silva@example.com','password':'NovaSenha@2026'})
new_token = body_new.get('access_token') or body_new.get('accessToken')
print(f"6) Login com senha nova: HTTP {st}, token={ 'OK' if new_token else 'FALHOU' }")
if not new_token:
    print("ERRO: falha de login com a nova senha!")
    sys.exit(1)

# 7) Restaurar senha original
st, pwd_rest = req('PUT', '/customer-portal/password', token=new_token, body={
    'oldPassword': 'NovaSenha@2026',
    'newPassword': 'Cliente@2024'
})
print(f"7) Restaurando senha original para consistência de testes: HTTP {st}")

print("\n=== TODOS OS TESTES PASSARAM COM SUCESSO ===")
