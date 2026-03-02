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

export const MULTI_ROBOTS = [
  {
    code: "OMIE_VENDAS",
    name: "Omie: Vendas",
    description: "Pedidos, OS, Faturamento e Notas Fiscais",
    icon: "ShoppingCart",
    actions: [
      { value: "criar_pedido", label: "Gerar Pedido de Venda" },
      { value: "criar_os", label: "Gerar Ordem de Serviço" },
      { value: "faturar_pedido", label: "Faturar Pedido" },
      { value: "faturar_os", label: "Faturar OS" },
      { value: "obter_nfe", label: "Obter NF-e (PDF/XML)" },
      { value: "obter_nfse", label: "Obter NFS-e (PDF/XML)" },
    ],
  },
  {
    code: "OMIE_FINANCEIRO",
    name: "Omie: Financeiro",
    description: "Boletos, PIX, Cobranças e Títulos",
    icon: "CreditCard",
    actions: [
      { value: "gerar_boleto", label: "Gerar Boleto (Omie.Cash)" },
      { value: "gerar_pix", label: "Gerar QR Code PIX" },
      { value: "consultar_pagamento", label: "Consultar Status de Pagamento" },
      { value: "baixar_titulo", label: "Baixar Título Manualmente" },
      { value: "prorrogar_boleto", label: "Prorrogar Vencimento" },
      { value: "verificar_inadimplencia", label: "Verificar Inadimplência do Cliente" },
    ],
  },
  {
    code: "OMIE_ESTOQUE",
    name: "Omie: Estoque",
    description: "Posição, Reservas e Preços",
    icon: "Package",
    actions: [
      { value: "consultar_estoque", label: "Consultar Estoque Disponível" },
      { value: "reservar_produtos", label: "Reservar Produtos" },
      { value: "atualizar_precos", label: "Sincronizar Preços" },
      { value: "alertar_minimo", label: "Verificar Estoque Mínimo" },
    ],
  },
  {
    code: "OMIE_CLIENTES",
    name: "Omie: Clientes/CRM",
    description: "Sincronização e Histórico de Clientes",
    icon: "Users",
    actions: [
      { value: "sincronizar_cliente", label: "Sincronizar Cliente" },
      { value: "consultar_historico", label: "Consultar Histórico de Compras" },
      { value: "verificar_credito", label: "Verificar Limite de Crédito" },
      { value: "obter_contatos", label: "Obter Contatos do Cliente" },
    ],
  },
  {
    code: "OMIE_CONTRATOS",
    name: "Omie: Contratos",
    description: "Recorrência e Faturamento de Contratos",
    icon: "FileText",
    actions: [
      { value: "criar_contrato", label: "Criar Contrato de Recorrência" },
      { value: "faturar_contrato", label: "Faturar Contrato do Mês" },
      { value: "consultar_renovacao", label: "Consultar Renovações Pendentes" },
      { value: "cancelar_contrato", label: "Cancelar Contrato" },
    ],
  },
  {
    code: "OMIE_COMPRAS",
    name: "Omie: Compras",
    description: "Requisições, Contas a Pagar e Importação DANFE",
    icon: "Truck",
    actions: [
      { value: "criar_conta_pagar", label: "Lançar Contas a Pagar (com rateio/CC)" },
      { value: "importar_danfe", label: "Importar NF-e via Chave DANFE" },
      { value: "criar_requisicao_compra", label: "Criar Requisição de Compra" },
    ],
  },
] as const;

export type MultiRobot = typeof MULTI_ROBOTS[number];
export type RobotAction = MultiRobot["actions"][number];
