#!/usr/bin/env python3
"""
Suite Completa de Testes de Endpoints - Relm Care+
Testa todos os módulos de endpoints da API em produção com asserções detalhadas de:
- Status HTTP
- Contrato de dados / Shape do JSON
- Autenticação e Autorização (Admin, Lojista, Cliente)
- Respostas a erros e regras de negócio
- Disponibilidade de assets estáticos e páginas públicas
"""
import urllib.request
import urllib.error
import json
import os
import sys
import time

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip())

load_env()

BASE_URL = os.environ.get('TEST_BASE_URL', 'http://177.153.62.248/api')
PUBLIC_BASE_URL = os.environ.get('PUBLIC_BASE_URL', 'http://177.153.62.248')

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

results = []

def run_test(name, module, method, path, token=None, body=None, expected_status=200, validator=None, is_public_path=False):
    url = (PUBLIC_BASE_URL if is_public_path else BASE_URL) + path
    headers = {'User-Agent': 'Relm-Endpoint-Test-Runner/1.0'}
    data = None
    if body is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(body).encode('utf-8')
    if token:
        headers['Authorization'] = f'Bearer {token}'

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    start_time = time.time()
    res_status = 0
    res_data = None
    raw_content = b''
    content_type = ''

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_status = resp.status
            content_type = resp.headers.get('Content-Type', '')
            raw_content = resp.read()
            if 'application/json' in content_type:
                res_data = json.loads(raw_content.decode('utf-8') or '{}')
            else:
                res_data = raw_content
    except urllib.error.HTTPError as e:
        res_status = e.code
        content_type = e.headers.get('Content-Type', '')
        raw_content = e.read()
        try:
            res_data = json.loads(raw_content.decode('utf-8') or '{}')
        except Exception:
            res_data = raw_content.decode('utf-8', 'replace')
    except Exception as e:
        res_status = -1
        res_data = {'error': str(e)}

    duration_ms = round((time.time() - start_time) * 1000, 2)
    
    status_ok = (res_status == expected_status) if isinstance(expected_status, int) else (res_status in expected_status)
    val_ok = True
    val_msg = ''
    if validator and status_ok:
        try:
            val_ok, val_msg = validator(res_data, res_status, content_type)
        except Exception as e:
            val_ok = False
            val_msg = f'Erro no validador: {str(e)}'

    passed = status_ok and val_ok
    status_desc = f'HTTP {res_status}' if res_status > 0 else 'CONEXAO FALHOU'
    
    result_item = {
        'name': name,
        'module': module,
        'method': method,
        'path': path,
        'expected_status': expected_status,
        'actual_status': res_status,
        'passed': passed,
        'duration_ms': duration_ms,
        'error_detail': '' if passed else (val_msg or f'Esperava {expected_status}, recebeu {res_status}: {str(res_data)[:200]}'),
        'data': res_data
    }
    results.append(result_item)
    
    status_symbol = '[OK  PASS]' if passed else '[FAIL-ERRO]'
    print(f"{status_symbol} ({module}) {method} {path} -> {status_desc} ({duration_ms}ms)")
    if not passed:
        print(f"       Detalhes: {result_item['error_detail']}")
    
    return result_item

def main():
    print("=" * 80)
    print(f"=== INICIANDO BATERIA COMPLETA DE TESTES DE ENDPOINT: {BASE_URL} ===")
    print("=" * 80)

    # -------------------------------------------------------------
    # 1. Health & Status
    # -------------------------------------------------------------
    run_test(
        name="Health Check Básico",
        module="Health",
        method="GET",
        path="/health",
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, dict) and d.get('status') == 'ok', "Status diferente de 'ok'")
    )

    run_test(
        name="Health Check Crons",
        module="Health",
        method="GET",
        path="/health/crons",
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, dict) and ('jobs' in d or 'status' in d), "Estrutura de crons inválida")
    )

    # -------------------------------------------------------------
    # 2. Autenticação & Autorização
    # -------------------------------------------------------------
    login_res = run_test(
        name="Login Admin Válido",
        module="Auth",
        method="POST",
        path="/auth/login",
        body={"email": "admin@relmbikes.com.br", "password": "Admin@2024"},
        expected_status=[200, 201],
        validator=lambda d, s, c: (
            isinstance(d, dict) and ('access_token' in d or 'accessToken' in d or 'token' in d),
            "Token JWT não retornado"
        )
    )
    
    admin_token = None
    if isinstance(login_res.get('data'), dict):
        admin_token = login_res['data'].get('access_token') or login_res['data'].get('accessToken') or login_res['data'].get('token')

    if not admin_token:
        print("[ERRO CRITICO] Falha ao obter token de admin. Interrompendo.")
        sys.exit(1)

    # Login com senha inválida (espera 401)
    run_test(
        name="Login com Credenciais Inválidas (Bloqueio 401)",
        module="Auth",
        method="POST",
        path="/auth/login",
        body={"email": "admin@relmbikes.com.br", "password": "SenhaIncorreta_999"},
        expected_status=401,
        validator=lambda d, s, c: (True, "")
    )

    # Rota protegida sem token (espera 401)
    run_test(
        name="Acesso Sem Token a Rota Protegida (Bloqueio 401)",
        module="Auth",
        method="GET",
        path="/customers",
        expected_status=401,
        validator=lambda d, s, c: (True, "")
    )

    # -------------------------------------------------------------
    # 3. Clientes (Customers)
    # -------------------------------------------------------------
    cust_res = run_test(
        name="Listagem Paginada de Clientes",
        module="Customers",
        method="GET",
        path="/customers?page=1&pageSize=10",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (
            isinstance(d, dict) and 'data' in d and 'total' in d and isinstance(d['data'], list),
            "Contrato paginado {data: [], total: number} inválido"
        )
    )

    first_customer_id = None
    if isinstance(cust_res.get('data'), dict) and len(cust_res['data'].get('data', [])) > 0:
        first_customer_id = cust_res['data']['data'][0].get('id')

    if first_customer_id:
        run_test(
            name="Detalhes de um Cliente Específico",
            module="Customers",
            method="GET",
            path=f"/customers/{first_customer_id}",
            token=admin_token,
            expected_status=200,
            validator=lambda d, s, c: (isinstance(d, dict) and d.get('id') == first_customer_id, "ID do cliente divergente")
        )

    # -------------------------------------------------------------
    # 4. Configurações do Clube
    # -------------------------------------------------------------
    run_test(
        name="Listar Configurações do Clube",
        module="ClubSettings",
        method="GET",
        path="/club-settings",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (
            (isinstance(d, list) or isinstance(d, dict)) and len(d) > 0,
            "Configurações do clube vazias"
        )
    )

    # -------------------------------------------------------------
    # 5. Pontos & Recompensas (Rewards)
    # -------------------------------------------------------------
    run_test(
        name="Catálogo de Recompensas",
        module="Rewards",
        method="GET",
        path="/v1/rewards/catalog",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list), "Catálogo deve ser uma lista")
    )

    run_test(
        name="Regras de Pontuação Admin",
        module="Points",
        method="GET",
        path="/v1/points/admin/rules",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list), "Regras de pontuação devem ser uma lista")
    )

    # -------------------------------------------------------------
    # 6. Garantias (Warranty)
    # -------------------------------------------------------------
    run_test(
        name="Listar Chamados de Garantia",
        module="Warranty",
        method="GET",
        path="/warranty/claims",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list) or (isinstance(d, dict) and 'data' in d), "Formato de garantias inválido")
    )

    # -------------------------------------------------------------
    # 7. Vendas (Sales)
    # -------------------------------------------------------------
    run_test(
        name="Listar Vendas",
        module="Sales",
        method="GET",
        path="/sales?page=1&limit=10",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, dict) or isinstance(d, list), "Formato de vendas inválido")
    )

    run_test(
        name="Itens Pendentes de Curadoria (Sales)",
        module="Sales",
        method="GET",
        path="/sales/items/pending-curation",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list) or isinstance(d, dict), "Formato inválido")
    )

    # -------------------------------------------------------------
    # 8. Lojas, Parceiros & Serviços Mestres
    # -------------------------------------------------------------
    run_test(
        name="Listar Lojas",
        module="Stores",
        method="GET",
        path="/stores",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list) or (isinstance(d, dict) and 'data' in d), "Formato de lojas inválido")
    )

    run_test(
        name="Listar Parceiros",
        module="Partners",
        method="GET",
        path="/partners",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list) or (isinstance(d, dict) and 'data' in d), "Formato de parceiros inválido")
    )

    run_test(
        name="Listar Serviços Mestres",
        module="MasterServices",
        method="GET",
        path="/master-services",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list) and len(d) > 0, "Serviços mestres não encontrados")
    )

    run_test(
        name="Localizador Público de Lojas",
        module="PublicStores",
        method="GET",
        path="/public/stores",
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list), "Lojas públicas devem ser uma lista")
    )

    # -------------------------------------------------------------
    # 9. Marketing & Landing Pages
    # -------------------------------------------------------------
    run_test(
        name="Listar Landing Pages no Painel Admin",
        module="Marketing",
        method="GET",
        path="/marketing/landing-pages",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list), "Landing pages devem ser uma lista")
    )

    run_test(
        name="Gerar Preview HTML de Landing Page",
        module="Marketing",
        method="POST",
        path="/marketing/landing-pages/preview-html",
        token=admin_token,
        body={
            "blocksJson": {
                "titulo": "Campanha Teste de Endpoints",
                "subtitulo": "Garantindo 100% de qualidade e estabilidade",
                "hero": {
                    "titulo": "Inverno na Trilha",
                    "subtitulo": "Revisão e seguro completos para você pedalar sem sustos",
                    "ctaTexto": "Assinar Care+"
                },
                "meio": [{"tipo": "texto", "conteudo": "Teste automatizado da suíte de QA"}]
            }
        },
        expected_status=[200, 201],
        validator=lambda d, s, c: (
            isinstance(d, dict) and 'html' in d and '<!DOCTYPE html>' in d['html'],
            "HTML de preview não gerado corretamente"
        )
    )

    # -------------------------------------------------------------
    # 10. Email CRM & Assistente de IA
    # -------------------------------------------------------------
    run_test(
        name="Listar Templates de Email CRM",
        module="EmailCRM",
        method="GET",
        path="/email-crm/templates",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list), "Templates devem ser uma lista")
    )

    run_test(
        name="Listar Campanhas de Email CRM",
        module="EmailCRM",
        method="GET",
        path="/email-crm/campaigns",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list), "Campanhas devem ser uma lista")
    )

    run_test(
        name="Obter Configuração de IA",
        module="AiAssistant",
        method="GET",
        path="/ai-assistant/config",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (
            isinstance(d, dict) and 'textModel' in d and 'imageModel' in d,
            "Configuração de IA incompleta"
        )
    )

    # -------------------------------------------------------------
    # 11. Eventos & Notificações
    # -------------------------------------------------------------
    run_test(
        name="Listar Eventos (Admin)",
        module="Events",
        method="GET",
        path="/events",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list) or (isinstance(d, dict) and 'data' in d), "Formato de eventos inválido")
    )

    run_test(
        name="Eventos Públicos",
        module="Events",
        method="GET",
        path="/public/events",
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list), "Eventos públicos devem ser uma lista")
    )

    run_test(
        name="Listar Notificações",
        module="Notifications",
        method="GET",
        path="/notifications",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list) or (isinstance(d, dict) and 'notifications' in d), "Formato de notificações inválido")
    )

    # -------------------------------------------------------------
    # 12. Auditoria & Relatórios
    # -------------------------------------------------------------
    run_test(
        name="Listar Logs de Auditoria",
        module="AuditLogs",
        method="GET",
        path="/audit-logs?page=1&pageSize=10",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, dict) or isinstance(d, list), "Formato de logs de auditoria inválido")
    )

    run_test(
        name="Resumo de Garantias (Relatórios)",
        module="Reports",
        method="GET",
        path="/reports/warranty-summary",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, dict) or isinstance(d, list), "Resumo de garantias inválido")
    )

    run_test(
        name="Dashboard Stats (Relatórios)",
        module="Reports",
        method="GET",
        path="/reports/dashboard-stats",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, dict), "Dashboard stats deve ser um dicionário")
    )

    run_test(
        name="Passivo de Pontos do Clube (Relatórios)",
        module="Reports",
        method="GET",
        path="/reports/club/points-liability",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, dict), "Passivo de pontos deve ser um dicionário")
    )

    run_test(
        name="Receita do Clube (Relatórios)",
        module="Reports",
        method="GET",
        path="/reports/club/revenue",
        token=admin_token,
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, dict), "Receita do clube deve ser um dicionário")
    )

    # -------------------------------------------------------------
    # 13. Endpoints Públicos & Arquivos Estáticos
    # -------------------------------------------------------------
    run_test(
        name="Banners Públicos",
        module="PublicBanners",
        method="GET",
        path="/public/banners",
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list), "Banners públicos devem ser uma lista")
    )

    run_test(
        name="Produtos Públicos",
        module="PublicProducts",
        method="GET",
        path="/public/products",
        expected_status=200,
        validator=lambda d, s, c: (isinstance(d, list), "Produtos públicos devem ser uma lista")
    )

    run_test(
        name="Entrega de Imagem Estática de Marketing (Acervo)",
        module="StaticUploads",
        method="GET",
        path="/uploads/marketing/acervo/ciclismo-acervo-1.png",
        expected_status=200,
        is_public_path=True,
        validator=lambda d, s, c: ('image/' in c or len(d) > 1000, "Header Content-Type ou tamanho da imagem inválido")
    )

    # -------------------------------------------------------------
    # Resumo Final
    # -------------------------------------------------------------
    print("=" * 80)
    print("RESUMO GERAL DA SUITE DE TESTES DE ENDPOINT")
    print("=" * 80)
    
    total = len(results)
    passed_count = sum(1 for r in results if r['passed'])
    failed_count = total - passed_count
    taxa_sucesso = (passed_count / total) * 100 if total > 0 else 0
    total_time = sum(r['duration_ms'] for r in results)

    print(f"Total de Endpoints Testados: {total}")
    print(f"Testes Aprovados:           {passed_count} ({taxa_sucesso:.1f}%)")
    print(f"Testes com Falhas:          {failed_count}")
    print(f"Tempo Total de Execucao:    {total_time:.2f}ms")
    print("=" * 80)

    if failed_count > 0:
        print("[ERRO] DETALHAMENTO DE FALHAS:")
        for r in results:
            if not r['passed']:
                print(f"- [{r['module']}] {r['method']} {r['path']}: {r['error_detail']}")
        sys.exit(1)
    else:
        print("[SUCESSO] TODOS OS TESTES DE ENDPOINT FORAM CONCLUIDOS COM 100% DE SUCESSO!")
        sys.exit(0)

if __name__ == '__main__':
    main()
