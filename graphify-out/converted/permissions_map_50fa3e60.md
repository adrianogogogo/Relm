<!-- converted from permissions_map.docx -->

Mapa de Permissões e Controle de Acesso (RBAC) — Relm Care+
Este documento apresenta a estrutura completa de papéis, a hierarquia de controle de acesso baseado em funções (RBAC) e o mapeamento de endpoints do sistema Relm Care+.
1. Hierarquia de Papéis e Acesso
A estrutura de permissões do sistema divide-se em 6 perfis principais. Os perfis administrativos da equipe interna (ADMIN_RELM, GERENTE_RELM, SUPORTE_RELM) operam em regime de herança vertical de acessos, enquanto os perfis parceiros e externos (LOJA, DISTRIBUIDOR, CUSTOMER) possuem acessos isolados de acordo com o escopo.
2. Mapeamento Detalhado por Perfil
2.1. Administrador (ADMIN_RELM)
- Escopo: Acesso irrestrito a todos os dados e configurações do sistema.
- Permissões Exclusivas: Visualização completa de logs de auditoria (GET /audit-logs), gerenciamento de usuários administrativos (CRUD de User) e deleção de lojas (DELETE /stores/:id), eventos, benefícios e banners.

2.2. Gerente (GERENTE_RELM)
- Escopo: Gestão operacional diária de revendedores, garantias e campanhas de vantagens.
- Permissões Principais: Aprovação e rejeição de solicitações de garantias, aprovação de cotações de seguros, criação e atualização de lojas, eventos e benefícios.
- Restrições: Não possui permissão para deletar lojas, acessar logs de auditoria ou gerenciar equipe administrativa.

2.3. Suporte (SUPORTE_RELM)
- Escopo: Atendimento técnico de primeiro nível e triagem de garantias.
- Permissões Principais: Transição de status de garantias na FSM (ex: de RECEBIDO para EM_ANALISE ou AGUARDANDO_CLIENTE), visualização de clientes, seguros, eventos e banners.
- Restrições: Não possui permissão de aprovação final (aprovar/rejeitar garantia ou seguro), criação ou deleção de registros.

2.4. Loja / Lojista (LOJA / STORE)
- Escopo: Acesso restrito para revendedores autorizados da Relm Bikes.
- Permissões Principais: Visualização de garantias, clientes e seguros vinculados especificamente à sua própria loja. Registro de garantias e solicitação de cotações de seguros. Gerenciamento de seus próprios colaboradores no portal da loja.
- Restrições: Isolamento total contra visualização de dados de outras lojas parceiras.

2.5. Distribuidor (DISTRIBUIDOR)
- Escopo: Acesso de acompanhamento comercial para distribuidores parceiros.
- Permissões Principais: Listar e visualizar dados gerais de clientes e lojas para relatórios de vendas.
- Restrições de Privacidade (LGPD): Todos os dados sensíveis do cliente (como CPF e Telefone) são retornados com máscaras de privacidade (ex: 123.***.**-01).

2.6. Cliente (CLIENTE / CUSTOMER)
- Escopo: Área exclusiva de clientes finais (auto-atendimento).
- Permissões Principais: Visualização do histórico de suas próprias garantias, cotações de seguros contratadas e eventos inscritos. Auto-cadastro integrado.
- Restrições: Totalmente isolado do painel e das APIs operacionais e administrativas.

3. Matriz Geral de Endpoints (RBAC)
A tabela abaixo resume a matriz de permissões para os principais endpoints expostos no backend:
Legenda: SIM = Acesso permitido; NAO = Acesso negado; Masc. = Acesso permitido com dados de CPF e Telefone mascarados (LGPD).
| Funcionalidade | Endpoint | ADMIN | GERENTE | SUPORTE | LOJA | DIST. | CLIE. |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Garantia — Registrar (Público) | POST /public/warranty | SIM | SIM | SIM | SIM | SIM | SIM |
| Garantia — Listar | GET /warranty/claims | SIM | SIM | SIM | NAO | NAO | NAO |
| Garantia — Alterar Status (FSM) | PATCH /warranty/claims/:id/status | SIM | SIM | SIM | NAO | NAO | NAO |
| Garantia — Aprovar / Rejeitar | POST /warranty/claims/:id/approve|reject | SIM | SIM | NAO | NAO | NAO | NAO |
| Garantia — Validar Comprovante | GET /public/warranty/validate/:token | SIM | SIM | SIM | SIM | SIM | SIM |
| Garantia — Minhas Garantias | GET /customer-portal/warranties | NAO | NAO | NAO | NAO | NAO | SIM |
| Lojas — Criar / Atualizar | POST / PATCH /stores | SIM | SIM | NAO | NAO | NAO | NAO |
| Lojas — Listar | GET /stores | SIM | SIM | SIM | NAO | SIM | NAO |
| Lojas — Excluir | DELETE /stores/:id | SIM | NAO | NAO | NAO | NAO | NAO |
| Clientes — Listar / Detalhes | GET /customers | SIM | SIM | SIM | Masc. | Masc. | NAO |
| Clientes — Remover | DELETE /customers/:id | SIM | NAO | NAO | NAO | NAO | NAO |
| Seguros — Listar / Detalhes | GET /insurance/quotes | SIM | SIM | SIM | SIM | NAO | NAO |
| Seguros — Aprovar / Rejeitar | PATCH /insurance/quotes/:id/approve | SIM | SIM | NAO | NAO | NAO | NAO |
| Seguros — Minhas Cotações | GET /customer-portal/insurance-quotes | NAO | NAO | NAO | NAO | NAO | SIM |
| Eventos — Criar / Editar | POST / PATCH /events | SIM | SIM | NAO | NAO | NAO | NAO |
| Eventos — Inscrições | GET /events/:id/registrations | SIM | SIM | SIM | NAO | NAO | NAO |
| Benefícios — Criar / Editar | POST / PATCH /benefits | SIM | SIM | NAO | NAO | NAO | NAO |
| Auditoria — Visualizar Logs | GET /audit-logs | SIM | NAO | NAO | NAO | NAO | NAO |
| Usuários Admin — Gerenciar | * /admin-users | SIM | NAO | NAO | NAO | NAO | NAO |