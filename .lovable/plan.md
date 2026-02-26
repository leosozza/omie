

## Placements Omie no Bitrix24

Criar uma aba "Omie ERP" dentro das fichas de Deal, Lead, Contato e Empresa no Bitrix24, exibindo um painel completo com dados do Omie (financeiro, pedidos/NFs, historico do cliente, estoque).

### Arquitetura

```text
Bitrix24 Detail Page
  └── Tab "Omie ERP" (placement)
        └── iframe → Edge Function (omie-placement)
              └── HTML/CSS renderizado server-side
                    ├── Resumo Financeiro (boletos, PIX, status pgto)
                    ├── Pedidos & NF-e/NFS-e (lista + links PDF)
                    ├── Histórico do Cliente (compras, crédito)
                    └── Estoque dos Produtos (disponível, reserva)
```

### Implementacao

#### 1. Registrar placements no `bitrix-install` e `bitrix-iframe`

Adicionar chamadas a `placement.bind` na funcao `registerRobots` (ou funcao separada `registerPlacements`) para registrar 4 placements:

- `CRM_DEAL_DETAIL_TAB` → "Omie ERP"
- `CRM_LEAD_DETAIL_TAB` → "Omie ERP"  
- `CRM_CONTACT_DETAIL_TAB` → "Omie ERP"
- `CRM_COMPANY_DETAIL_TAB` → "Omie ERP"

Handler URL: `{SUPABASE_URL}/functions/v1/omie-placement`

Guardar status no DB (nova coluna `placements_registered` em `bitrix_installations` ou reutilizar `robots_registry`).

#### 2. Criar Edge Function `omie-placement`

Nova funcao `supabase/functions/omie-placement/index.ts` que:

- Recebe POST do Bitrix24 com `PLACEMENT`, `PLACEMENT_OPTIONS`, auth data (`member_id`, `access_token`)
- Identifica o tipo de entidade (deal/lead/contact/company) e o ID da entidade
- Busca dados do Omie via credenciais do tenant:
  - **Financeiro**: `financas/contareceber` → boletos/PIX pendentes, status
  - **Pedidos**: `produtos/pedido/ListarPedidos` → pedidos vinculados ao cliente
  - **NF-e/NFS-e**: dados de notas fiscais
  - **Cliente**: `geral/clientes/ConsultarCliente` → historico, credito
  - **Estoque**: `estoque/consulta` → posicao de estoque
- Para Deal/Lead: busca o cliente vinculado via `crm.deal.get` / `crm.lead.get` do Bitrix
- Renderiza HTML responsivo com CSS inline (roda dentro do iframe do Bitrix)

#### 3. Migração de banco

Adicionar coluna `placements_registered boolean DEFAULT false` na tabela `bitrix_installations` para controlar se os placements ja foram registrados.

#### 4. Frontend - Pagina de Placements

Criar pagina `src/pages/Placements.tsx` no dashboard para mostrar status dos placements registrados (similar a pagina Robots). Adicionar rota `/placements` e item no sidebar.

#### 5. Layout do HTML do Placement

O HTML renderizado server-side tera 4 secoes em tabs ou accordion:

- **Financeiro**: cards com boletos pendentes, QR PIX, status de pagamento
- **Pedidos/NFs**: tabela com pedidos, status, links para PDF de NF-e/NFS-e
- **Cliente**: info do cliente no Omie, limite de credito, ultimas compras
- **Estoque**: tabela com produtos, qtd disponivel, reservada, preco

Estilo visual consistente com o branding Omie (cores, fontes), CSS inline para funcionar no iframe.

### Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| `supabase/functions/omie-placement/index.ts` | Criar - edge function principal |
| `supabase/functions/bitrix-iframe/index.ts` | Modificar - adicionar `registerPlacements()` |
| `src/pages/Placements.tsx` | Criar - pagina de status |
| `src/components/layout/AppSidebar.tsx` | Modificar - adicionar link |
| `src/App.tsx` | Modificar - adicionar rota |
| Migration SQL | Adicionar `placements_registered` column |

