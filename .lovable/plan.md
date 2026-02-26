

## Diagnostico: Instalacao nao finaliza no Bitrix24

### Causa Raiz Identificada

Analisei os logs das edge functions e encontrei **3 problemas**:

**1. `BX24.installFinish()` nunca e chamado (CRITICO)**
O Bitrix24 exige que o handler de instalacao chame `BX24.installFinish()` via JS SDK para sinalizar que a instalacao foi concluida. Sem isso, o Bitrix24 fica preso mostrando "instalando..." e nunca finaliza. O codigo atual apenas mostra HTML e redireciona, mas nunca chama esse metodo.

**2. Campo `domain` salvo vazio**
Os logs mostram `domain=` vazio porque os FLAT params do Bitrix24 (`AUTH_ID, REFRESH_ID, member_id, SERVER_ENDPOINT`) nao incluem `DOMAIN`. O `SERVER_ENDPOINT` contem a URL (ex: `https://xxx.bitrix24.com/rest/`), mas o codigo nao extrai o domain dele.

**3. Reinstall retorna 302 bruto dentro do iframe**
Para reinstalls, o codigo retorna um HTTP 302 redirect direto. Dentro do iframe do Bitrix24, isso pode ser bloqueado pelo browser. Deveria retornar HTML com `BX24.init()` + redirect via JS.

### Evidencia nos Logs

```
bitrix-install: form keys received (8): AUTH_ID, AUTH_EXPIRES, REFRESH_ID, SERVER_ENDPOINT, member_id, status, PLACEMENT, PLACEMENT_OPTIONS
bitrix-install: checking FLAT params - AUTH_ID=true member_id=true domain=
```

Domain vazio + no `BX24.installFinish()` = instalacao nunca finaliza.

### Plano de Correcao

#### Modificar `supabase/functions/bitrix-install/index.ts`

1. **Extrair domain do SERVER_ENDPOINT** quando DOMAIN nao esta presente nos FLAT params:
   ```typescript
   // Se domain vazio, extrair de SERVER_ENDPOINT
   // "https://xxx.bitrix24.com/rest/" → "xxx.bitrix24.com"
   if (!domain && serverEndpoint) {
     try { domain = new URL(serverEndpoint).hostname; } catch {}
   }
   ```

2. **Chamar `BX24.installFinish()`** no HTML de sucesso (primeira instalacao):
   ```javascript
   BX24.init(function() {
     BX24.installFinish();
     setTimeout(function() {
       window.location.href = '...iframe URL...';
     }, 500);
   });
   ```

3. **Substituir 302 por HTML com BX24** para reinstalls tambem (em vez de redirect bruto, retornar HTML que chama `BX24.init()` e faz redirect via JS):
   ```javascript
   BX24.init(function() {
     window.location.href = '...iframe URL...';
   });
   ```

4. **Setar `client_endpoint` corretamente** quando vazio, usando domain extraido

### Arquivos a modificar
- `supabase/functions/bitrix-install/index.ts` — unica mudanca necessaria

