## Revisao UX Design - Bitrix24

### Status: ✅ Concluído

---

# Plano de Desenvolvimento — Conector Omie × Bitrix24

## Status Atual

### ✅ Implementado (Backend — Edge Functions)
- Instalação/OAuth Bitrix24: `bitrix-install`, `bitrix-uninstall`, `bitrix-refresh-token`, `bitrix-iframe`
- Validação Omie: `omie-validate`
- Multi-Robot Handler: `omie-multi-robot` (5 robots: Vendas, Financeiro, Estoque, Clientes, Contratos)
- Robot Registration: Lazy registration via `bitrix-iframe`
- Webhook Handler: `omie-webhook`
- Edge Functions individuais: `omie-financas`, `omie-boleto-pix`, `omie-estoque`, `omie-compras`, `omie-contratos-crm`, `omie-contador`, `omie-create-order`, `omie-create-service-order`, `omie-invoice-handler`, `omie-sync-customer`, `omie-discover-fields`, `bitrix-discover-fields`
- Database: 9 tabelas com RLS

### ✅ Implementado (Frontend)
- Dashboard com stats, conexões, logs recentes, módulos
- Configuração Omie (validar + salvar credenciais)
- Mapeamento de Campos (descoberta bidirecional + CRUD)
- Robots (listagem com status)
- Simulador (3 cenários)
- Todas as páginas de módulo com empty states
- Logs de integração

---

## 🔴 Fase 1: Dados Reais nas Páginas (MAIOR IMPACTO)

### 1.1 Vendas
- [ ] Listar pedidos reais via `omie-create-order` → `action: "list"`
- [ ] Tabela com nº, cliente, valor, etapa, data
- [ ] Botão "Sincronizar" funcional
- [ ] Formulário "Novo Pedido" (cliente, produtos)
- [ ] Tab NF-e listando via `omie-invoice-handler` → `action: "list"`
- [ ] Download PDF via `action: "get_pdf"`

### 1.2 Finanças
- [ ] Tab "A Receber" via `omie-financas` → `listar_contas_receber`
- [ ] Tab "A Pagar" via `omie-financas` → `listar_contas_pagar`
- [ ] Gerar boleto funcional → `omie-boleto-pix` → `gerar_boleto`
- [ ] Gerar PIX funcional → `omie-boleto-pix` → `gerar_pix`
- [ ] Exibir QR Code PIX
- [ ] Stats calculados dos dados reais

### 1.3 Estoque
- [ ] Listar posição via `omie-estoque` → `listar_posicao`
- [ ] Consultar produto individual
- [ ] Listar movimentações
- [ ] Alerta visual de produtos abaixo do mínimo

### 1.4 CRM
- [ ] Tab Contatos via `omie-contratos-crm` → `listar_contas_crm`
- [ ] Tab Oportunidades via `listar_oportunidades`
- [ ] Sincronizar funcional
- [ ] Novo contato com formulário

### 1.5 Compras
- [ ] Listar requisições, pedidos de compra, notas de entrada

### 1.6 Contratos
- [ ] Listar contratos, renovações pendentes, faturar individual

### 1.7 Contador
- [ ] Listar XMLs NF-e/NFS-e
- [ ] Download XML individual
- [ ] Resumo fiscal mensal
- [ ] Exportação em lote

---

## 🟡 Fase 2: Sync Queue Worker

- [ ] Criar edge function `sync-queue-worker`
- [ ] Retry com backoff exponencial
- [ ] Processar por prioridade
- [ ] Cron ou Realtime trigger

---

## 🟡 Fase 3: APIs Omie Faltantes

| API | Prioridade | Status |
|-----|-----------|--------|
| Produtos (CRUD, variações, kits) | Alta | ❌ |
| Vendedores | Média | ❌ |
| Tabela de Preços | Média | ❌ |
| Extrato CC / Fluxo de Caixa | Média | ❌ |
| Cupom Fiscal / NFC-e | Baixa | ❌ |
| Ordens de Produção | Baixa | ❌ |
| Remessas / CT-e | Baixa | ❌ |
| CRM Omie (Tarefas) | Baixa | ❌ |
| Departamentos / Categorias / Projetos | Baixa | ❌ |

---

## 🟡 Fase 4: Bitrix24 — Funcionalidades Avançadas

### 4.1 Auto-Provisioning de Campos
- [ ] Criar campos UF_CRM_OMIE_* via `crm.deal.userfield.add` na 1ª execução
- [ ] Campos: CUSTOMER_ID, ORDER_ID, OS_ID, NF_URL, NF_NUMBER, TITULO_ID, CONTRACT_ID
- [ ] Verificar existência antes de criar

### 4.2 Robots Multi-Entidade
- [ ] Registrar robots para Leads, Contacts, Companies (não apenas Deals)
- [ ] Adaptar `omie-multi-robot` para múltiplas entidades

### 4.3 B24Frame SDK
- [ ] Implementar `B24Frame` no frontend quando embarcado no iframe
- [ ] `BX24.getAuth()` para autenticação automática
- [ ] `BX24.fitWindow()` para ajustar iframe
- [ ] `BX24.placement.info()` para contexto

### 4.4 Timeline Activities
- [ ] Adicionar timeline comments para todas as ações (não apenas NF)
- [ ] Boleto gerado, pagamento confirmado, estoque reservado, etc.

### 4.5 Smart Process Automation (SPA)
- [ ] Suporte a SPAs customizados via `crm.type.list`

---

## 🟡 Fase 5: Segurança e Resiliência

- [ ] Token refresh com retry e alerta de expiração definitiva
- [ ] Rate limiting Omie (20 req/min por app_key)
- [ ] Considerar vault para credenciais
- [ ] RLS policies baseadas em user_roles para frontend
- [ ] Tenant isolation rigoroso

---

## 🟢 Fase 6: UX/UI Avançado

### 6.1 Relatórios
- [ ] Página `/relatorios` (já no sidebar, sem rota)
- [ ] Gráficos: volume de sincronizações, erros por dia, top ações

### 6.2 Simulador Expandido
- [ ] Cenários para todos os módulos
- [ ] Cenário e2e: cliente → pedido → fatura → NF

### 6.3 Notificações
- [ ] Alertas de erros críticos
- [ ] Badge no sidebar
- [ ] Email/webhook para alertas

### 6.4 Onboarding Wizard
- [ ] Setup guiado: Credenciais → Mapeamento → Ativar Robots
- [ ] Checklist no dashboard

### 6.5 Multi-idioma
- [ ] i18n (pt-BR, en, es) para marketplace global

---

## Ordem de Execução Recomendada

1. **Fase 1** — Dados reais nas páginas (2-3 sprints) ← MAIOR IMPACTO
2. **Fase 4.1/4.3** — Auto-provisioning + B24Frame (1 sprint)
3. **Fase 2** — Sync Queue Worker (1 sprint)
4. **Fase 3 (Produtos)** — Pré-requisito para muitas ações (1 sprint)
5. **Fase 5** — Segurança (1 sprint)
6. **Fase 6.1/6.4** — Relatórios + Onboarding (1 sprint)
7. **Fases 3/4/7** — APIs complementares e features avançadas (ongoing)
