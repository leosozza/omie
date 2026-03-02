

## Fluxo de Requisicao de Compras Avancado (Centro de Custo, Rateio, Conta Corrente, DANFE)

Expandir a integracao atual para suportar o fluxo completo de requisicao de compras com parametros avancados do Omie.

### O que sera feito

**1. Nova tabela `purchase_config` (migracao)**
Armazena configuracoes por tenant: conta corrente padrao, categoria padrao, e regras de rateio por centro de custo.

```text
purchase_config
├── id (uuid PK)
├── tenant_id (text)
├── config_type (text: "conta_corrente" | "categoria" | "centro_custo" | "rateio")
├── omie_code (text) — codigo do Omie (CC, categoria, departamento)
├── omie_name (text) — nome legivel
├── bitrix_field (text, nullable) — campo do Bitrix mapeado
├── percentual (numeric, nullable) — % do rateio
├── is_default (boolean) — se e o padrao
├── is_active (boolean)
├── created_at, updated_at
```

RLS: somente leitura para tenant autenticado (edge functions usam service_role para escrita).

**2. Expandir edge function `omie-compras`**
Adicionar actions:
- `listar_centros_custo` → `geral/departamentos` / `ListarDepartamentos`
- `listar_categorias` → `geral/categorias` / `ListarCategorias`
- `listar_contas_correntes` → `geral/contacorrente` / `ListarContasCorrentes`
- `incluir_conta_pagar_avancado` → `financas/contapagar` / `IncluirContaPagar` com suporte a `distribuicao` (rateio), `id_conta_corrente`, `codigo_categoria`
- `importar_nfe_danfe` → `produtos/nfentrada` / `ImportarNFeEntrada` via chave de acesso DANFE

**3. Novo robot `OMIE_COMPRAS` no multi-robot**
Adicionar em `constants.ts` e no `omie-multi-robot`:
- `criar_conta_pagar` — Lancar contas a pagar com rateio/CC
- `importar_danfe` — Importar NF-e via chave de acesso
- `criar_requisicao_compra` — Criar requisicao no Omie

**4. Pagina de Configuracao de Compras (frontend)**
Nova aba na pagina `Compras.tsx` chamada "Configuracoes" com:
- Selecao de Conta Corrente padrao (carregada do Omie)
- Configuracao de Centros de Custo e regras de rateio (linhas com departamento + %, validacao = 100%)
- Categoria padrao para lancamentos

**5. Expandir pagina `Compras.tsx`**
Adicionar aba "Contas a Pagar" com formulario para lancamento manual que usa as configuracoes salvas (CC, rateio, categoria).

### Arquivos a criar/modificar

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `purchase_config` + RLS |
| `supabase/functions/omie-compras/index.ts` | Adicionar 5 novas actions |
| `supabase/functions/omie-multi-robot/index.ts` | Adicionar handler `handleCompras` |
| `src/lib/constants.ts` | Adicionar robot `OMIE_COMPRAS` |
| `src/pages/Compras.tsx` | Adicionar abas Configuracoes e Contas a Pagar |

