export const BITRIX_ENTITIES = [
  { value: "lead", label: "Leads" },
  { value: "deal", label: "Negócios (Deals)" },
  { value: "contact", label: "Contatos" },
  { value: "company", label: "Empresas" },
  { value: "spa", label: "Smart Process (SPA)" },
] as const;

export const OMIE_ENTITIES = [
  { value: "cliente", label: "Clientes" },
  { value: "pedido", label: "Pedidos de Venda" },
  { value: "os", label: "Ordens de Serviço" },
  { value: "nfe", label: "Notas Fiscais (NF-e)" },
  { value: "nfse", label: "Notas de Serviço (NFS-e)" },
  { value: "produto", label: "Produtos" },
  { value: "servico", label: "Serviços" },
] as const;

export const MAPPING_DIRECTIONS = [
  { value: "omie_to_bitrix", label: "Omie → Bitrix24" },
  { value: "bitrix_to_omie", label: "Bitrix24 → Omie" },
  { value: "bidirectional", label: "Bidirecional ↔" },
] as const;

export const SYNC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "warning" },
  processing: { label: "Processando", color: "info" },
  success: { label: "Sucesso", color: "success" },
  error: { label: "Erro", color: "destructive" },
  retrying: { label: "Tentando novamente", color: "warning" },
};

export const ROBOTS = [
  {
    code: "OMIE_CREATE_ORDER",
    name: "Gerar Pedido na Omie",
    description: "Cria um Pedido de Venda na Omie a partir do Negócio",
    icon: "ShoppingCart",
  },
  {
    code: "OMIE_CREATE_SERVICE_ORDER",
    name: "Gerar OS na Omie",
    description: "Cria uma Ordem de Serviço na Omie a partir do Negócio",
    icon: "Wrench",
  },
  {
    code: "OMIE_CHECK_PAYMENT",
    name: "Consultar Status Financeiro",
    description: "Verifica se o título está aberto, liquidado ou atrasado",
    icon: "CreditCard",
  },
  {
    code: "OMIE_GET_INVOICE",
    name: "Obter Nota Fiscal (PDF)",
    description: "Busca o PDF da NF-e ou NFS-e relacionada",
    icon: "FileText",
  },
  {
    code: "OMIE_SYNC_STOCK",
    name: "Sincronizar Estoque",
    description: "Atualiza quantidade disponível baseado na Omie",
    icon: "Package",
  },
] as const;
