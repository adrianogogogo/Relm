# Sistema de Acompanhamento de Garantia — Especificação para Replicação

> Documento de **especificação técnica neutra de plataforma**. Descreve, em
> detalhe suficiente para reconstruir em **qualquer stack** (outra linguagem,
> outro banco), o sistema de:
> - progressão de **status** da garantia (máquina de estados / FSM);
> - **reversão de status** (override administrativo);
> - **atividades/tarefas** (geração automática por etapa + manuais);
> - **histórico** completo de eventos (timeline);
> - **fechamento automático** e **auditoria**.
>
> É descritivo: não pressupõe NestJS/Prisma/React. Onde houver regra, ela está
> explícita (enums, transições, guardas, gatilhos). Reproduza as **regras**, não
> a tecnologia.

---

## 1. Visão geral do fluxo

Uma **garantia** (claim) nasce num status inicial e avança por uma **máquina de
estados forward-only**. A cada mudança de status:

1. valida-se a transição contra a FSM;
2. validam-se campos obrigatórios da transição;
3. grava-se um **evento de histórico**;
4. geram-se **tarefas automáticas** da nova etapa (a partir de templates), uma
   única vez por etapa;
5. ao entrar num status "resolvido", agenda-se o **fechamento automático**.

Existe um caminho **paralelo e privilegiado**: a **reversão de status**
(override), que ignora a FSM, permite ir para qualquer status, exige
justificativa, é registrada no histórico e **não** dispara e-mail ao cliente.

```
                 (criação)
                    │
                    ▼
   ┌──────────┐   iniciar análise   ┌────────────┐
   │ RECEBIDO │ ──────────────────▶ │ EM_ANALISE │ ◀────────────┐
   └──────────┘                     └────────────┘              │
                                       │   │   │   "cliente respondeu"
                  falta info ──────────┘   │   └────────┐        │
                          ▼                │            ▼        │
                 ┌─────────────────────┐   │      (aprovar)      │
                 │ AGUARDANDO_CLIENTE   │ ──┘            ▼        │
                 └─────────────────────┘          ┌──────────┐   │
                          (reprovar) ────────────▶│ REPROVADO│   │
                                                  └──────────┘   │
                                       ┌──────────┐              │
                              (aprovar)│ APROVADO │              │
                                       └──────────┘              │
                                            │ finalizar          │
                                            ▼                    │
                                      ┌────────────┐             │
                                      │ FINALIZADO │ (terminal)  │
                                      └────────────┘             │
                  reversão/override ──────────────────────────────
                  (qualquer → qualquer, inclusive CANCELADO)
```

---

## 2. Enums

### 2.1 Status da garantia (`WarrantyStatus`)
| Valor | Significado |
|-------|-------------|
| `RECEBIDO` | Registrada, aguardando triagem. |
| `EM_ANALISE` | Em triagem/análise técnica. |
| `AGUARDANDO_CLIENTE` | Aguardando resposta/informação do cliente. |
| `APROVADO` | Garantia aprovada (gera token de validação + e-mail). |
| `REPROVADO` | Garantia recusada (e-mail com motivo). |
| `FINALIZADO` | Resolvida e fechada (terminal). |
| `CANCELADO` | Cancelada (terminal; alcançável **só** via reversão). |

### 2.2 Status do vínculo (`LinkStatus`) — opcional, metadado de origem
`PENDING_REVIEW` (criada pelo cliente/loja, a confirmar) · `CONFIRMED` (criada
pela equipe) · `NOT_FOUND`.

### 2.3 Perfis (papéis de usuário)
`ADMIN_RELM`, `GERENTE_RELM`, `SUPORTE_RELM`, `LOJA`, `DISTRIBUIDOR`, `CLIENTE`.

### 2.4 Status da tarefa
`pendente` (default) · `concluida` · `cancelada`.

---

## 3. Modelo de dados

Tipos genéricos: `uuid` = identificador; `text`; `int`; `timestamp`; `bool`;
`enum`. Ajuste aos tipos da sua plataforma.

### 3.1 `warranty_claim` (garantia)
Campos relevantes ao acompanhamento (omita os de domínio próprio do seu sistema):

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid | PK |
| `protocol_number` | text único | nº de protocolo legível |
| `status` | enum WarrantyStatus | default `RECEBIDO` |
| `link_status` | enum LinkStatus | default `PENDING_REVIEW` |
| `assigned_to_user_id` | uuid? → user | responsável atual |
| `auto_close_at` | timestamp? | data de fechamento automático |
| `cost` | decimal? | custo para a empresa (admin/gerente) |
| `customer_notes` | text? | observações do cliente |
| `admin_notes` | text? | notas internas |
| `rejection_reason` | text? | preenchido ao reprovar |
| `resolution` | text? | preenchido ao finalizar |
| `validation_token` | text único? | token público de validação (ao aprovar) |
| `token_generated_at` | timestamp? | |
| `validated_at` | timestamp? | 1ª validação (imutável) |
| `approved_at` | timestamp? | |
| `approved_by_user_id` | uuid? | |
| `approval_email_sent_at` | timestamp? | |
| `created_at` / `updated_at` | timestamp | |

### 3.2 `warranty_event` (HISTÓRICO / timeline) — núcleo deste documento
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid | PK |
| `claim_id` | uuid → warranty_claim | **on delete cascade** |
| `event_type` | text | ver §7 (lista fechada de tipos) |
| `from_status` | text? | status de origem (em mudanças de status) |
| `to_status` | text? | status de destino |
| `comment` | text? | comentário/justificativa/descrição |
| `created_by_user_id` | uuid? → user | quem gerou (null = sistema/cliente) |
| `created_at` | timestamp | ordena a timeline (asc) |

> O histórico é **append-only**: nunca se edita/apaga um evento. A timeline da
> garantia = todos os `warranty_event` daquele `claim_id` por `created_at`.

### 3.3 `warranty_task` (atividade/tarefa)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid | PK |
| `claim_id` | uuid → warranty_claim | on delete cascade |
| `title` | text | |
| `status` | text | `pendente` (default) / `concluida` / `cancelada` |
| `assignee` | text? | nome livre do responsável (ex.: pessoa) |
| `assignee_role` | text? | **perfil** responsável (enum de perfis) |
| `stage` | text? | status (etapa) que originou a tarefa |
| `due_date` | timestamp? | prazo |
| `auto_generated` | bool | default `false`; `true` se veio de template |
| `created_by_user_id` | uuid? | |
| `created_at` / `updated_at` | timestamp | |

### 3.4 `warranty_task_template` (regra de geração automática)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid | PK |
| `to_status` | enum WarrantyStatus | etapa que dispara a criação |
| `title` | text | título da tarefa criada |
| `description` | text? | |
| `target_role` | enum de perfis | perfil responsável da tarefa gerada |
| `sort_order` | int | default 0 (ordem de criação) |
| `active` | bool | default `true` (só ativos geram) |

### 3.5 `audit_log` (auditoria — opcional, trilha separada)
Trilha técnica independente do histórico de negócio. Campos:
`id`, `user_id?`, `action` (text), `entity` (text, ex.: `warranty_claims`),
`entity_id` (text), `metadata` (json), `created_at`. Gravação **best-effort**
(nunca quebra a operação principal). Ver §8.

---

## 4. Máquina de estados (FSM)

### 4.1 Transições permitidas (forward-only)
| De | Para (permitido) |
|----|------------------|
| `RECEBIDO` | `EM_ANALISE` |
| `EM_ANALISE` | `AGUARDANDO_CLIENTE`, `APROVADO`, `REPROVADO` |
| `AGUARDANDO_CLIENTE` | `EM_ANALISE` |
| `APROVADO` | `FINALIZADO` |
| `REPROVADO` | `FINALIZADO` |
| `FINALIZADO` | — (terminal) |
| `CANCELADO` | — (terminal) |

Qualquer transição fora desta tabela é **rejeitada** pelo fluxo normal (erro
"transição inválida"). `CANCELADO` **não** é alcançável pelo fluxo normal — só
por reversão (§5).

### 4.2 Guardas (campos obrigatórios por transição)
| Transição-alvo | Exige |
|----------------|-------|
| `→ AGUARDANDO_CLIENTE` | `comment` (comentário) |
| `→ REPROVADO` | `comment` **e** `rejection_reason` |
| `→ FINALIZADO` | `resolution` |
| `→ APROVADO` | (sem campo obrigatório; gera token — ver §4.4) |

### 4.3 Algoritmo da mudança de status (fluxo normal)
```
função mudarStatus(claimId, novoStatus, usuario, dados):
    claim = buscar(claimId); se não existe → erro
    se novoStatus ∉ FSM[claim.status] → erro "transição inválida"
    validar guardas de §4.2 (campos obrigatórios) → senão erro
    atualizar claim.status = novoStatus
        + se reprovado: gravar rejection_reason
        + se finalizado: gravar resolution
        + aplicar fechamentoAutomatico(novoStatus)   // §6
    gravar evento STATUS_CHANGE {from, to, comment, by=usuario}   // §7
    registrar auditoria WARRANTY_STATUS_CHANGED (best-effort)     // §8
    gerarTarefasAutomaticas(claimId, de=claim.status, para=novoStatus, usuario) // §9
```

### 4.4 Aprovação (`→ APROVADO`) e validação pública
Ao aprovar:
- valida transição pela FSM (só de `EM_ANALISE`);
- gera `validation_token` aleatório (≥32 bytes hex) + `token_generated_at`,
  `approved_at`, `approved_by_user_id`;
- aplica fechamento automático (§6);
- envia e-mail ao cliente com link público de validação (best-effort: falha de
  e-mail **não** desfaz a aprovação; grava `approval_email_sent_at` se enviado);
- grava evento `APPROVED`;
- auditoria `WARRANTY_APPROVED`.

**Validação pública (endpoint sem autenticação):** dado o token, retorna os
dados mínimos da garantia **apenas se** `status = APROVADO`. A 1ª consulta grava
`validated_at` (carimbo **imutável**: consultas seguintes não o sobrescrevem — o
token serve como comprovante read-only reimprimível). Dados do cliente expostos
são **minimizados** (ex.: só primeiro nome + e-mail mascarado).

### 4.5 Reprovação (`→ REPROVADO`)
Valida FSM; exige `rejection_reason`; grava no claim; e-mail ao cliente com o
motivo (best-effort); evento `REJECTED`; auditoria `WARRANTY_REJECTED`; aplica
fechamento automático.

---

## 5. Reversão de status (override administrativo)

Caminho **separado da FSM**. Restrito a `ADMIN_RELM`/`GERENTE_RELM`.

Regras:
1. **Não** valida `FSM`. Permite ir para **qualquer** status válido do enum…
2. …**exceto** o status atual (novo status deve ser diferente).
3. **Exige `reason`** (justificativa), gravada no histórico.
4. **Não envia e-mail** ao cliente.
5. Se estiver **saindo de `APROVADO`**, limpa o comprovante de validação:
   zera `validation_token`, `validated_at`, `approved_at`,
   `approval_email_sent_at`, `token_generated_at` (para não restar comprovante
   "aprovado" válido após a reversão).
6. Reagenda/limpa o **fechamento automático**: se o destino é "resolvido"
   (`APROVADO`/`REPROVADO`/`FINALIZADO`) → define `auto_close_at = agora + 20
   dias`; senão → `auto_close_at = null`.
7. Grava evento `STATUS_REVERTED {from, to, comment=reason, by}`.
8. Auditoria `WARRANTY_STATUS_REVERTED`.
9. **Não** dispara geração automática de tarefas (é override manual).

```
função reverterStatus(claimId, novoStatus, reason, admin):
    claim = buscar(claimId); se não existe → erro
    se novoStatus == claim.status → erro "deve ser diferente"
    se novoStatus ∉ enum WarrantyStatus → erro
    saindoDeAprovado = (claim.status == APROVADO)
    atualizar claim.status = novoStatus
        + se saindoDeAprovado: limpar dados de validação (regra 5)
        + auto_close_at = resolvido(novoStatus) ? agora+20d : null
    gravar evento STATUS_REVERTED {from=claim.status, to=novoStatus, comment=reason, by=admin}
    auditoria WARRANTY_STATUS_REVERTED
```

---

## 6. Fechamento automático

- Constantes: `RESOLVED_STATUSES = {APROVADO, REPROVADO, FINALIZADO}`,
  `AUTO_CLOSE_DAYS = 20`.
- Ao **entrar** num status resolvido (via fluxo normal, aprovação, reprovação
  ou reversão), define `auto_close_at = agora + 20 dias`.
- **Importante:** no sistema atual `auto_close_at` é **apenas armazenado e
  exibido** — não há job/cron que efetivamente feche o ticket. (Caminho de
  evolução: um agendador que, ao chegar a data, mova para terminal. Replique só
  o armazenamento/exibição se quiser paridade exata.)

---

## 7. Histórico de eventos (timeline) — lista fechada de tipos

Cada operação grava **um** `warranty_event`. Tipos e quando gravar:

| `event_type` | Quando | Campos preenchidos |
|--------------|--------|--------------------|
| `CREATED` | Garantia criada | `to_status=RECEBIDO`, `comment` (origem) |
| `STATUS_CHANGE` | Mudança de status (fluxo normal) | `from_status`, `to_status`, `comment?`, `created_by` |
| `APPROVED` | Aprovação | `from_status`, `to_status=APROVADO`, `comment`, `created_by` |
| `REJECTED` | Reprovação | `from_status`, `to_status=REPROVADO`, `comment=motivo`, `created_by` |
| `STATUS_REVERTED` | Reversão/override | `from_status`, `to_status`, `comment=reason`, `created_by` |
| `COST_UPDATED` | Custo definido/limpo | `comment` (ex.: "Custo definido: R$ X") |
| `ASSIGNED` | Responsável definido/removido | `comment` (nome ou "removido"), `created_by` |
| `WORKFLOW_TASKS` | Tarefas automáticas geradas | `comment` ("N tarefa(s) automática(s)… etapa X") |
| `TASK_CREATED` | Tarefa criada (manual) | `comment="Tarefa criada: ..."` |
| `TASK_UPDATED` | Tarefa atualizada/concluída/reaberta | `comment` contextual |
| `TASK_DELETED` | Tarefa removida | `comment` |
| `ATTACHMENT_UPLOADED` | Anexo enviado | `comment="Arquivo anexado: ..."` |
| `ATTACHMENT_DELETED` | Anexo removido | `comment` |

Regras de gravação:
- A timeline é **append-only** e ordenada por `created_at` ascendente.
- A gravação de evento de **tarefa/anexo** é **best-effort** (um erro ao gravar
  o evento não deve impedir a ação principal).
- `created_by_user_id` nulo = ação do sistema ou de origem pública (cliente).

---

## 8. Auditoria (trilha técnica separada — opcional)

Independente do histórico de negócio (§7). Grava em `audit_log` nas operações
sensíveis de status, **best-effort** (nunca lança):

| `action` | Operação | `metadata` (exemplo) |
|----------|----------|----------------------|
| `WARRANTY_STATUS_CHANGED` | mudança de status | protocol, from, to, comment |
| `WARRANTY_APPROVED` | aprovação | protocol, from, to, adminNotes |
| `WARRANTY_REJECTED` | reprovação | protocol, from, to, rejectionReason |
| `WARRANTY_STATUS_REVERTED` | reversão | protocol, from, to, reason |

`entity = "warranty_claims"`, `entity_id = claim.id`. É legítimo replicar só o
§7 (histórico) e tratar o §8 como opcional.

---

## 9. Atividades/Tarefas

### 9.1 Geração automática por etapa (templates)
Ao **entrar** num status, o sistema cria automaticamente as tarefas dos
**templates ativos** cujo `to_status` = novo status.

**Idempotência (regra crítica):** uma etapa gera suas tarefas **no máximo uma
vez por garantia**. Antes de gerar, conta as tarefas `auto_generated=true` com
`stage = novoStatus` daquele claim; se já existir alguma, **não** gera de novo.
Isso evita duplicação quando se **reentra** numa etapa (ex.:
`AGUARDANDO_CLIENTE → EM_ANALISE`, ou reversão `APROVADO → … → APROVADO`).

```
função gerarTarefasAutomaticas(claimId, de, para, usuario):
    já = contar warranty_task onde claim_id=claimId e stage=para e auto_generated=true
    se já > 0 → retornar           // idempotente por etapa
    templates = warranty_task_template onde to_status=para e active=true, ordenar por sort_order
    se vazio → retornar
    nomePorPerfil = {}             // resolução de nome do responsável
        se claim.assigned_to existe: nomePorPerfil[claim.assigned_to.role] = claim.assigned_to.name
        para perfis sem nome: pegar um usuário ativo daquele perfil (se houver)
    para cada tpl em templates:
        criar warranty_task {
            claim_id, title=tpl.title,
            assignee_role = tpl.target_role,
            assignee = nomePorPerfil[tpl.target_role] || null,
            stage = para,
            status = 'pendente',
            auto_generated = true,
            created_by = usuario,
        }
    gravar evento WORKFLOW_TASKS (1 evento agrupado)
```

Disparada em: mudança de status (fluxo normal), **aprovação** e **reprovação**.
**Não** disparada na reversão (§5) nem em status terminais sem template.

### 9.2 Tarefas manuais
Criadas sob demanda. Campos: `title` (obrigatório), `assignee?` (nome),
`assignee_role?` (perfil), `due_date?`. Ao criar, herdam `stage = status atual`
da garantia e `auto_generated=false`. Geram evento `TASK_CREATED`.

### 9.3 Operações de tarefa
- **Concluir/Reabrir:** alterna `status` entre `concluida`/`pendente`; grava
  `TASK_UPDATED` ("Tarefa concluída/reaberta").
- **Editar/Remover:** `TASK_UPDATED` / `TASK_DELETED`.

### 9.4 Visibilidade por perfil (regra de exibição)
- `ADMIN_RELM` e `GERENTE_RELM` veem **todas** as tarefas (mesmo fora da sua
  responsabilidade).
- Demais perfis veem **apenas** as tarefas do **seu** `assignee_role`.

### 9.5 "Próximos Passos" (vínculo etapa ↔ tarefas)
Na tela da garantia, as tarefas com `stage = status atual` são exibidas como os
"próximos passos" da etapa. **Soft gate:** ao transicionar, se houver tarefas
**pendentes** da etapa atual, exibir aviso ("há N pendentes") — **sem bloquear**
o avanço (admin/gerente mantêm override).

### 9.6 Seed dos templates (conjunto canônico atual)
| `to_status` | `title` | `target_role` | `sort_order` |
|-------------|---------|---------------|--------------|
| EM_ANALISE | Verificar nota fiscal e dados do produto | SUPORTE_RELM | 0 |
| EM_ANALISE | Analisar defeito relatado e fotos | GERENTE_RELM | 1 |
| EM_ANALISE | Definir custo estimado da garantia | GERENTE_RELM | 2 |
| AGUARDANDO_CLIENTE | Acompanhar resposta do cliente | SUPORTE_RELM | 0 |
| APROVADO | Solicitar peça ao fornecedor | GERENTE_RELM | 0 |
| APROVADO | Organizar envio da peça ao cliente | SUPORTE_RELM | 1 |
| APROVADO | Registrar código de rastreio | SUPORTE_RELM | 2 |
| REPROVADO | Enviar comunicado de rejeição ao cliente | SUPORTE_RELM | 0 |
| FINALIZADO | Confirmar recebimento com o cliente | SUPORTE_RELM | 0 |
| FINALIZADO | Atualizar relatório financeiro | ADMIN_RELM | 1 |

---

## 10. Responsável (assignee da garantia)

- `warranty_claim.assigned_to_user_id` aponta o responsável atual.
- Definir/remover: restrito a `ADMIN_RELM`/`GERENTE_RELM`; usuário-alvo deve ser
  ativo e de um perfil "interno" (ex.: ADMIN/GERENTE/SUPORTE).
- Toda atribuição grava evento `ASSIGNED`.
- Usado na resolução de nome em §9.1 (quando o perfil da tarefa = perfil do
  responsável, mostra o nome dele).

---

## 11. API sugerida (contrato neutro)

> Nomes/rotas são sugestão; o que importa são as operações e regras.

| Método & rota | Ação | Permissão |
|---------------|------|-----------|
| `PATCH /warranty/claims/:id/status` | mudança FSM (`{to_status, comment?, rejection_reason?, resolution?}`) | ADMIN/GERENTE |
| `POST /warranty/claims/:id/approve` | aprovar (gera token + e-mail) | ADMIN/GERENTE |
| `POST /warranty/claims/:id/reject` | reprovar (`{rejectionReason, adminNotes?}`) | ADMIN/GERENTE |
| `PATCH /warranty/claims/:id/revert-status` | reversão override (`{toStatus, reason}`) | ADMIN/GERENTE |
| `PATCH /warranty/claims/:id/cost` | definir/limpar custo | ADMIN/GERENTE |
| `PATCH /warranty/claims/:id/assign` | definir/remover responsável (`{userId|null}`) | ADMIN/GERENTE |
| `POST /warranty/claims/:id/tasks` | criar tarefa manual | ADMIN/GERENTE |
| `PATCH /warranty/tasks/:taskId` | atualizar/concluir tarefa | ADMIN/GERENTE |
| `DELETE /warranty/tasks/:taskId` | remover tarefa | ADMIN/GERENTE |
| `GET /warranty/claims/:id` | detalhe + **histórico** (eventos) + tarefas + responsável | ADMIN/GERENTE |
| `GET /public/warranty/validate/:token` | validação pública (sem auth) | público |

O `GET .../:id` deve retornar, junto do claim: a lista de `warranty_event`
(ordenada asc) com o nome de quem gerou; as `warranty_task`; e o responsável.

---

## 12. Checklist de replicação

- [ ] Criar enums: `WarrantyStatus`, `LinkStatus`, perfis, status de tarefa.
- [ ] Criar tabelas: `warranty_claim`, `warranty_event`, `warranty_task`,
      `warranty_task_template` (e `audit_log` se quiser a trilha técnica).
- [ ] Implementar a **FSM** (§4.1) + **guardas** (§4.2).
- [ ] Implementar **aprovação** com token + validação pública imutável (§4.4).
- [ ] Implementar **reversão** com todas as 9 regras (§5).
- [ ] Implementar **fechamento automático** (+20 dias) — só armazenar/exibir (§6).
- [ ] Gravar **todos os tipos de evento** nos pontos certos (§7).
- [ ] Implementar **geração automática de tarefas** idempotente por etapa (§9.1).
- [ ] Semear os **templates canônicos** (§9.6).
- [ ] Implementar **tarefas manuais** + operações + eventos (§9.2–9.3).
- [ ] Implementar **visibilidade por perfil** e "Próximos Passos" + soft gate (§9.4–9.5).
- [ ] Implementar **responsável** (assignee) + evento `ASSIGNED` (§10).
- [ ] Expor o **histórico** no detalhe da garantia (§11).

---

### Resumo das invariantes (não quebrar ao replicar)
1. Fluxo normal **só** segue a FSM; `CANCELADO` só por reversão.
2. Histórico é **append-only**; toda operação relevante deixa um evento.
3. Geração de tarefas é **idempotente por etapa** (nunca duplica ao reentrar).
4. Reversão limpa o comprovante de validação ao **sair de APROVADO**.
5. `validated_at` é gravado **uma vez** (comprovante imutável).
6. Auditoria e e-mails são **best-effort** — nunca desfazem a operação principal.
