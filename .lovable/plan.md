

## Analise do Estado Atual vs Escopo Solicitado

Apos revisar todo o codigo existente, o sistema ja possui uma base solida. Abaixo esta o mapa de cobertura e o plano para fechar as lacunas.

### O que JA esta implementado

| Modulo | Status | Detalhes |
|---|---|---|
| Multi-tenancy | Completo | Via `bitrix_installations.member_id` + RLS em todas as tabelas |
| Auth/Credentials | Completo | `omie_configurations` + `bitrix_installations` (OAuth tokens) |
| Field Mapping | Completo | `field_mappings` + auto-discovery + auto-provisioning |
| Sync Queue | Parcial | Tabela `sync_queue` existe, webhook enfileira, mas **nao ha worker** processando |
| Logs/Auditoria | Completo | `integration_logs` com UI de consulta |
| Vendas (Pedidos/OS/NF) | Completo | Edge function + robot |
| Financeiro (Boleto/PIX/CR) | Completo | Edge function + robot |
| Estoque | Completo | Edge function + robot |
| CRM/Clientes | Parcial | Sync basico, falta validacao CPF/CNPJ e dedup |
| Compras (CP/Rateio/DANFE) | Completo | Edge function + robot + config UI |
| Contratos | Completo | Edge function + robot |
| Contador (XMLs) | Completo | Edge function |
| Placements (iFrame Bitrix) | Completo | 4 abas no CRM |
| Robots | Completo | 6 multi-robots registrados |

### Lacunas Criticas a Implementar

```text
FASE 1: Queue Worker + Retry (infraestrutura)
├── Edge function "sync-queue-worker" que processa sync_queue
├── pg_cron para disparar a cada 1 minuto
├── Retry com backoff exponencial
└── Botao "Reprocessar" na UI de Logs

FASE 2: Produtos e Catalogo (novo modulo)
├── Edge function "omie-produtos"
│   ├── ListarProdutos / ConsultarProduto
│   ├── ListarTabelaPrecos
│   └── Sync para Bitrix (crm.product.add/update)
├── Pagina frontend "Produtos"
└── Webhook Omie "Produto.Incluido/Alterado" → sync_queue

FASE 3: Status/Pipeline Mapping (mapeamento visual)
├── Nova tabela "pipeline_mappings"
│   ├── bitrix_pipeline_id / stage_id
│   ├── omie_etapa / omie_entity_type
│   └── trigger_action (ex: "criar_pedido" ao entrar na fase X)
├── UI de mapeamento visual (Pipeline → Etapas Omie)
└── Webhook Bitrix "onCrmDealUpdate" → avaliar regra → disparar acao

FASE 4: CRM Avancado (CPF/CNPJ + Dedup)
├── Validacao de CPF/CNPJ no sync de clientes
├── Busca por CNPJ antes de criar (anti-duplicidade)
├── Consulta CEP via API (ViaCEP)
└── Tags cruzadas Bitrix↔Omie para rastreio
```

### Recomendacao de Sequencia

Sugiro comecar pela **Fase 1 (Queue Worker)** pois e a base que faz toda a arquitetura de webhooks funcionar de verdade. Hoje os webhooks do Omie sao recebidos e enfileirados em `sync_queue`, mas ninguem processa essa fila — os itens ficam eternamente "pending".

**Fase 1 inclui:**

1. **Nova edge function `sync-queue-worker`** que:
   - Busca ate 10 itens com `status = 'pending'` e `next_retry_at IS NULL OR next_retry_at <= now()`
   - Roteia por `action` para as edge functions existentes (omie-sync-customer, omie-create-order, etc)
   - Marca `success` ou `error` com backoff exponencial (retry_count * 60s)
   - Atualiza `processed_at` e `error_message`

2. **pg_cron schedule** para chamar o worker a cada minuto

3. **UI de Retry** na pagina de Logs: botao para resetar um item da fila para `pending`

4. **Dashboard widget** mostrando itens pendentes na fila com aging

### Arquivos a criar/modificar (Fase 1)

| Arquivo | Acao |
|---|---|
| `supabase/functions/sync-queue-worker/index.ts` | Criar — worker que processa a fila |
| SQL (insert tool, nao migration) | pg_cron job para disparo periodico |
| `src/pages/Logs.tsx` | Adicionar botao "Reprocessar" por log |
| `src/pages/Dashboard.tsx` | Widget de aging da fila |
| `supabase/config.toml` | Registrar nova function |

Qual fase voce quer implementar primeiro?

