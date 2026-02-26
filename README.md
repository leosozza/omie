# Omie × Bitrix24 Connector

Conector de integração entre **Omie ERP** e **Bitrix24 CRM**, automatizando vendas, finanças, estoque, contratos e emissão de notas fiscais.

## Visão Geral

Este projeto conecta o Omie ERP ao Bitrix24 CRM através de robots automatizados, permitindo:

- 🛒 **Vendas** — Criar pedidos, faturar e obter NF-e/NFS-e com PDF oficial
- 💰 **Finanças** — Gerar boletos, PIX, consultar pagamentos e inadimplência
- 📦 **Estoque** — Consultar posição, reservar produtos e alertas de mínimo
- 📋 **Contratos** — Criar, faturar e gerenciar renovações
- 👥 **CRM** — Sincronizar clientes, histórico e crédito
- 🧾 **Contador** — Módulo contábil integrado

## Arquitetura

```
Bitrix24 (CRM) ←→ Edge Functions ←→ Omie (ERP)
                       ↕
                   Supabase (DB)
```

### Robots Multi-Função

O conector utiliza 5 robots "guarda-chuva" no Bitrix24:

| Robot | Módulo | Ações |
|-------|--------|-------|
| `OMIE_VENDAS` | Vendas | criar_pedido, faturar, obter_nfe/nfse |
| `OMIE_FINANCEIRO` | Finanças | boleto, pix, pagamentos |
| `OMIE_ESTOQUE` | Estoque | consulta, reserva, alertas |
| `OMIE_CLIENTES` | CRM | sincronizar, histórico, crédito |
| `OMIE_CONTRATOS` | Contratos | criar, faturar, renovar |

### Emissão de Nota Fiscal

O fluxo de NF funciona assim:

1. Robot cria pedido/OS no Omie
2. Robot fatura (etapa 50) → Omie emite NF junto à SEFAZ/Prefeitura
3. Robot `obter_nfe`/`obter_nfse` busca o PDF oficial
4. Link do PDF é salvo no deal e adicionado à timeline do Bitrix24

## Stack Tecnológica

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase Edge Functions (Deno)
- **Banco de Dados**: PostgreSQL (Supabase)
- **APIs**: Omie REST API + Bitrix24 REST API

## Desenvolvimento Local

```sh
# Clonar o repositório
git clone <YOUR_GIT_URL>

# Entrar no diretório
cd <YOUR_PROJECT_NAME>

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## Edge Functions

| Função | Descrição |
|--------|-----------|
| `omie-multi-robot` | Handler principal dos robots |
| `omie-validate` | Validação de credenciais Omie |
| `omie-webhook` | Webhook para eventos do Omie |
| `omie-invoice-handler` | Gestão de notas fiscais |
| `bitrix-install` | Instalação do app no Bitrix24 |
| `bitrix-iframe` | Interface embarcada no Bitrix24 |
| `bitrix-discover-fields` | Descoberta de campos do CRM |

## Estrutura do Projeto

```
src/
├── components/       # Componentes React
├── pages/            # Páginas da aplicação
├── hooks/            # Custom hooks
├── lib/              # Utilitários e constantes
└── integrations/     # Cliente Supabase

supabase/
├── functions/        # Edge Functions
├── migrations/       # Migrações do banco
└── config.toml       # Configuração
```

## Licença

Projeto proprietário — uso restrito.
