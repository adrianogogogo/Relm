import requests
import json
import sys

BASE_URL = "http://177.153.62.248/api"

def run_test():
    print("=== TESTANDO FLUXO DE INSCRIÇÃO E MEUS EVENTOS ===")
    
    # 1. Login como cliente (GUIA Cliente PLUS)
    login_res = requests.post(f"{BASE_URL}/customer-auth/login", json={
        "email": "guia-plus@relm.test",
        "password": "Password@123"
    })
    
    if login_res.status_code not in (200, 201):
        print(f"[FAIL] Falha no login do cliente: {login_res.status_code} - {login_res.text}")
        return False
        
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Cliente logado com sucesso (guia-plus@relm.test)")
    
    # 2. Listar eventos públicos
    events_res = requests.get(f"{BASE_URL}/public/events")
    events = events_res.json()
    if not events:
        print("[FAIL] Nenhum evento retornado")
        return False
    event = events[0]
    print(f"[OK] Evento público encontrado: '{event['title']}' (ID: {event['id']})")
    
    # 3. Listar 'Meus Eventos' antes
    my_events_before = requests.get(f"{BASE_URL}/customer-portal/events", headers=headers).json()
    print(f"[INFO] Inscrições do cliente antes: {len(my_events_before)}")
    
    # 4. Inscrever-se via endpoint direto do portal do cliente
    reg_res = requests.post(f"{BASE_URL}/customer-portal/events/{event['id']}/register", headers=headers)
    print(f"[INFO] Inscrição customer-portal status: {reg_res.status_code} - {reg_res.text}")
    
    # Se já estava inscrito ou acabou de inscrever
    if reg_res.status_code in (200, 201) or "já está inscrito" in reg_res.text:
        print("[OK] Resposta de inscrição no portal tratada corretamente")
    else:
        print(f"[FAIL] Erro na inscrição: {reg_res.status_code}")
        return False
        
    # 5. Listar 'Meus Eventos' depois
    my_events_after = requests.get(f"{BASE_URL}/customer-portal/events", headers=headers).json()
    print(f"[INFO] Inscrições do cliente depois: {len(my_events_after)}")
    
    found = any(e['event']['id'] == event['id'] for e in my_events_after)
    if found:
        print(f"[OK] Evento '{event['title']}' confirmado e visível em 'Meus Eventos'!")
        return True
    else:
        print("[FAIL] Evento não apareceu em 'Meus Eventos'")
        return False

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
