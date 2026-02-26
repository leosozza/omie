

## Situacao Atual

Os robots `obter_nfe` e `obter_nfse` no `omie-multi-robot` ja buscam o link do PDF da NF via API Omie (`ConsultarNF` / `ConsultarNFSe`), mas apenas retornam o link como `result_url` nos `return_values` do robot. O link nao e salvo no deal nem enviado ao cliente.

## Fluxo da Emissao de NF

```text
Bitrix24 Deal
    │
    ├─ Robot OMIE_VENDAS: criar_pedido → Cria pedido no Omie
    ├─ Robot OMIE_VENDAS: faturar_pedido → Muda etapa para "Faturar" (etapa 50)
    │   └─ Omie emite a NF-e/NFS-e junto à prefeitura/SEFAZ
    ├─ Robot OMIE_VENDAS: obter_nfe → Busca link do DANFE (PDF oficial)
    │   └─ HOJE: retorna URL mas NAO salva no deal
    │
    └─ PROPOSTA: Salvar URL no deal + criar atividade/timeline
```

## Metodo Utilizado para PDF

- **NF-e (produtos)**: `ConsultarNF` com `nCodPed` → retorna `cLinkDanfe` (PDF do DANFE oficial da SEFAZ)
- **NFS-e (servicos)**: `ConsultarNFSe` com `nCodOS` → retorna `cLinkNFSe` (PDF da NFS-e oficial da prefeitura)

Estes sao links oficiais gerados apos autorizacao fiscal, nao previews.

## Plano: Salvar PDF no Deal e Enviar ao Cliente

### Modificar `omie-multi-robot/index.ts`

Nos cases `obter_nfe` e `obter_nfse` do `handleVendas`, apos obter o link:

1. **Salvar URL no campo do deal** via `crm.deal.update` com o link do PDF em um campo customizado (`UF_CRM_OMIE_NF_URL`)
2. **Criar entrada na timeline do deal** via `crm.timeline.comment.add` com o link para download
3. **Opcionalmente criar atividade de email** via `crm.activity.add` para enviar o PDF ao contato do deal

### Mudancas no handler `handleVendas`

Adicionar parametro `installation` ao `handleVendas` para poder chamar a API do Bitrix24:

```typescript
case "obter_nfe": {
  // ... buscar link como hoje ...
  
  if (result.cLinkDanfe && installation) {
    // 1. Salvar URL no deal
    await callBitrixApi(installation.client_endpoint, installation.access_token,
      "crm.deal.update", {
        id: dealData.ID,
        fields: {
          UF_CRM_OMIE_NF_URL: result.cLinkDanfe,
          UF_CRM_OMIE_NF_NUMBER: result.nNF?.toString(),
        }
      });
    
    // 2. Adicionar comentario na timeline
    await callBitrixApi(installation.client_endpoint, installation.access_token,
      "crm.timeline.comment.add", {
        fields: {
          ENTITY_ID: dealData.ID,
          ENTITY_TYPE: "deal",
          COMMENT: `NF-e #${result.nNF} emitida.\nDANFE: ${result.cLinkDanfe}`,
        }
      });
  }
}
```

### Mesma logica para `obter_nfse`

Salvar `cLinkNFSe` no deal e adicionar timeline comment.

### Assinatura do `handleVendas`

Mudar de:
```typescript
async function handleVendas(action, dealData, credentials)
```
Para:
```typescript
async function handleVendas(action, dealData, credentials, installation)
```

E passar `installation` na chamada no main handler (linha 594).

## Resultado

- O link do PDF fica salvo no campo `UF_CRM_OMIE_NF_URL` do deal
- Um comentario aparece na timeline do deal com o link para download
- O vendedor pode clicar e enviar ao cliente diretamente pelo Bitrix24

