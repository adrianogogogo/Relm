# Guia de Testes — Clube de Assinatura RELM Care+

Passo a passo para validar, onda por onda, tudo o que foi implementado.
Feito para testar pelo **navegador** (sem terminal). Ao final de cada onda há o
**resultado esperado** — se bater, a onda está OK.

---

## Acessos

**Site:** http://177.153.62.248

> Os domínios `careplus.relmbikes.com.br` ainda não estão no DNS — use o IP acima.

| Perfil | Onde loga | E-mail | Senha |
|---|---|---|---|
| Admin Relm | `/login` | `admin@relmbikes.com.br` | `Admin@2024` |
| Gerente Relm | `/login` | `gerente@relmbikes.com.br` | `Gerente@2024` |
| **Cliente CARE** (teste) | página de login do cliente (`/cliente`) | `guia-care@relm.test` | `Teste@2024` |
| **Cliente PLUS** (teste) | página de login do cliente (`/cliente`) | `guia-plus@relm.test` | `Teste@2024` |

> As duas contas de cliente foram criadas só para este teste (uma em cada tier),
> para você conseguir ver as diferenças CARE × PLUS na prática.

**Dica geral:** faça o teste em duas abas — uma logada como **Admin**, outra como
**Cliente** — porque muitos fluxos começam no admin e o efeito aparece no cliente.

---

## ONDA 1 — Pagamento da anuidade (vira PLUS)

**Objetivo:** a loja/Relm registra o pagamento da anuidade e o cliente vira PLUS por 1 ano.

1. Logue como **Admin** → menu **Pagamentos** (`/admin/pagamentos`).
2. Veja o campo "anuidade": deve mostrar **R$ 299,00** (valor configurado).
3. Clique em **Registrar pagamento**, busque o cliente **GUIA Cliente CARE**, confirme.
4. O pagamento aparece na lista como **CONFIRMADO**.
5. Abra a aba do **Cliente CARE** → menu **Assinatura** (`/cliente/assinatura`).

**✅ Resultado esperado:** a assinatura do cliente agora é **PLUS**, com **data de
vencimento daqui a 1 ano**, e o histórico mostra o pagamento de R$ 299. O saldo de
pontos ganhou o **bônus de renovação**.

**Testes de erro (opcional):** registrar pagamento com valor 0 é recusado; buscar
um cliente inexistente dá erro. O valor é sempre travado no configurado — a loja
não consegue registrar um valor menor.

---

## ONDA 2 — Apólice de seguro

**Objetivo:** uma cotação de seguro aprovada vira uma apólice com vigência.

1. Site público → **Seguro** (`/seguro`) → preencha uma cotação de teste e envie.
2. Admin → menu **Seguros** (`/admin/insurances`), aba **Cotações**: a cotação
   aparece como **Pendente**.
3. Abra a cotação → **Aprovar** (informe um valor, ex. 250) → depois **Converter em apólice**.
4. Vá na aba **Apólices**.

**✅ Resultado esperado:** existe uma apólice **POL-...** com status **ATIVA**,
vigência de 1 ano, ligada ao cliente. Tentar **converter a mesma cotação de novo**
é recusado (já foi convertida). No portal do cliente, em Seguro, a apólice aparece.

> Aviso de vencimento (30 e 7 dias antes) é automático por rotina diária — não dá
> para ver na hora, mas está agendado.

---

## ONDA 3 — Indicação, aniversário e presença em eventos

**Objetivo:** ganhar pontos indicando amigos, no aniversário e participando de eventos.

**Indicação:**
1. Logue como **Cliente PLUS** → **Painel** (`/cliente`). Localize o card
   **"Indique e ganhe"** e copie o **código de indicação**.
2. (O prêmio cai quando um indicado faz a 1ª compra — fluxo completo depende de
   cadastrar um novo cliente com esse código, o que exige nota fiscal.)

**Presença em evento (dá pra ver na hora):**
1. Admin → **Eventos** (`/admin/events`) → crie um evento de teste.
2. Inscreva um cliente no evento (ou use um já inscrito) → abra os inscritos →
   marque **Presente**.
3. Confira o saldo de pontos daquele cliente.

**✅ Resultado esperado:** ao marcar presença, o cliente ganha **+100 pontos**.
Marcar presença de novo **não** credita de novo (não duplica). O card de indicação
mostra um código único e o contador de indicações concluídas.

---

## ONDA 4 — Gamificação (conquistas + ranking)

**Objetivo:** medalhas por marcos e um ranking da comunidade com opt-in.

1. Logue como **Cliente PLUS** (que já recebeu um pagamento na Onda 1) → **Painel**.
2. Veja o card **Conquistas**: a medalha **"Primeira Compra"** deve estar
   **colorida (conquistada)**; as demais aparecem em cinza (a conquistar).
3. Vá em **Ranking** (`/cliente/ranking`). No começo está vazio (ninguém optou).
4. Ative o botão **"Participar do ranking"** e defina um **apelido**.
5. Recarregue: seu apelido aparece na lista com sua pontuação do ano.

**✅ Resultado esperado:** conquistas refletem o que o cliente fez; o ranking só
mostra quem **ativou o opt-in** (LGPD) e exibe o apelido, nunca o nome real.
Desligar o opt-in remove você da lista.

---

## ONDA 5 — Pré-venda por tier + Parcerias

**Objetivo:** itens/parceiros exclusivos que geram desejo de virar PLUS.

**Pré-venda:**
1. Admin → **Catálogo** (`/admin/catalogo`) → crie/edite um item marcando
   **pré-venda para PLUS** com uma **data futura**.
2. Abra o **Catálogo** (`/cliente/catalogo`) logado como **Cliente CARE**.
3. Depois abra o mesmo catálogo como **Cliente PLUS**.

**✅ Resultado esperado:** o item em pré-venda aparece **bloqueado** (com selo
"Pré-venda exclusiva PLUS" e botão "Seja Plus") para o **CARE**, e **liberado**
para o **PLUS**. Mesmo forçando pela API, um CARE não consegue resgatar (o sistema
confere o tier no servidor).

**Parcerias:**
1. Admin → **Parceiros** (`/admin/parceiros`) → cadastre um parceiro (ex. um café)
   com **tier mínimo PLUS**.
2. Veja **Parcerias** (`/cliente/parcerias`) como CARE e como PLUS.

**✅ Resultado esperado:** o parceiro PLUS aparece **bloqueado** para o CARE (com
CTA de upgrade) e **liberado** para o PLUS.

---

## ONDA 6 — Oficina (revisões, busca & entrega, bike fitting)

**Objetivo:** serviços com cotas anuais por tier e fila prioritária PLUS.

1. Logue como **Cliente CARE** → **Oficina** (`/cliente/oficina`).
2. Veja o **saldo por tipo de serviço**.
3. Logue como **Cliente PLUS** → **Oficina** e compare.

**✅ Resultado esperado:**
- **CARE:** só **1 revisão básica/ano** disponível; os demais tipos (revisão
  completa, lavagem, busca & entrega, bike fitting) aparecem **bloqueados**.
- **PLUS:** várias revisões, lavagem, **busca & entrega** (com campo de endereço)
  e **bike fitting** liberados, com o saldo anual de cada um.
- Agendar uma 2ª revisão básica no mesmo ano (CARE) é recusado por cota esgotada.
- Numa ordem de **busca & entrega**, a loja/admin avança as etapas da logística
  (coleta agendada → em transporte → na oficina → ... → entregue), sem pular etapa.

---

## ONDA 7 — Relatórios financeiros do clube

**Objetivo:** visão de dinheiro e crescimento do clube.

1. Logue como **Admin** (ou Gerente) → **Relatórios do Clube** (`/admin/relatorios-clube`).

**✅ Resultado esperado:** três blocos coerentes com o que você fez nos testes:
- **Passivo de pontos:** total de pontos ativos × valor do ponto (R$ 0,05) em reais.
- **Receita:** pagamentos confirmados por mês, MRR, taxa de renovação, churn.
  (o pagamento da Onda 1 deve aparecer no mês atual).
- **Funil:** quantos membros por origem (bike/indicação/orgânico), upgrades,
  indicações concluídas.

Sem estar logado, esses relatórios não abrem (401).

---

## ONDA 8 — Produção (saúde e rotinas)

**Objetivo:** confirmar que o sistema está saudável e as rotinas rodando.

No navegador, abra:
- http://177.153.62.248/api/health → deve responder `{"status":"ok"}`
- http://177.153.62.248/api/health/crons → lista as rotinas (expiração de
  assinatura, expiração de pontos, apólices, aniversário) com o último status.

**✅ Resultado esperado:** health "ok" e as rotinas listadas sem erros. A base de
clientes atual já foi migrada para o Care (nenhum cliente fica sem assinatura).

---

## Depois dos testes — limpeza

As contas `guia-care@relm.test` e `guia-plus@relm.test` e os dados marcados
"TESTE-..." podem ser removidos quando você terminar. Me peça e eu limpo, ou
deixe para usar como massa de teste fixa.

## Se algo não bater

Anote **em qual onda / passo** parou, o que apareceu na tela e (se for erro)
qualquer mensagem. Com isso eu localizo e corrijo rápido.
