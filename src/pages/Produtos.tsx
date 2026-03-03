import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Package,
  Search,
  RefreshCw,
  Tag,
  DollarSign,
  BarChart3,
  Upload,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

export default function Produtos() {
  const { memberId } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch products
  const {
    data: productsData,
    isLoading: loadingProducts,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["omie-produtos", memberId, currentPage],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-produtos", {
        body: {
          tenant_id: memberId,
          action: "listar_produtos",
          data: { pagina: currentPage, registros_por_pagina: 50 },
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  // Fetch price tables
  const {
    data: priceTablesData,
    isLoading: loadingPrices,
    refetch: refetchPrices,
  } = useQuery({
    queryKey: ["omie-tabelas-precos", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-produtos", {
        body: {
          tenant_id: memberId,
          action: "listar_tabelas_precos",
          data: {},
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  // Fetch families
  const { data: familiesData } = useQuery({
    queryKey: ["omie-familias", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-produtos", {
        body: {
          tenant_id: memberId,
          action: "listar_familias",
          data: {},
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const products = productsData?.data?.produto_servico_cadastro || [];
  const totalProducts = productsData?.data?.total_de_registros || 0;
  const totalPages = productsData?.data?.total_de_paginas || 1;
  const priceTables = priceTablesData?.data?.listaTabelasPrecos || [];
  const families = familiesData?.data?.famCadastro || [];

  const filteredProducts = products.filter(
    (p: any) =>
      (p.descricao || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.ncm || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSyncProduct = async (product: any) => {
    if (!memberId) return;
    try {
      const { data, error } = await supabase.functions.invoke("omie-produtos", {
        body: {
          tenant_id: memberId,
          action: "sync_to_bitrix",
          data: { produto: product },
        },
      });
      if (error) throw error;
      const action = data?.data?.bitrix_result?._action || "synced";
      toast.success(`Produto ${action === "updated" ? "atualizado" : "criado"} no Bitrix24`);
    } catch (err: any) {
      toast.error(`Erro ao sincronizar: ${err.message}`);
    }
  };

  const handleSyncAll = async () => {
    if (!memberId || !products.length) return;
    toast.info(`Sincronizando ${products.length} produtos...`);
    let success = 0;
    let errors = 0;
    for (const product of products) {
      try {
        await supabase.functions.invoke("omie-produtos", {
          body: {
            tenant_id: memberId,
            action: "sync_to_bitrix",
            data: { produto: product },
          },
        });
        success++;
      } catch {
        errors++;
      }
    }
    toast.success(`Sincronização concluída: ${success} ok, ${errors} erros`);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos & Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie produtos, SKUs, NCM e tabelas de preço do Omie
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchProducts();
              refetchPrices();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button size="sm" onClick={handleSyncAll} disabled={!products.length}>
            <Upload className="mr-2 h-4 w-4" />
            Sincronizar Todos
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total de Produtos"
          value={totalProducts}
          icon={Package}
          description="Cadastrados no Omie"
        />
        <StatsCard
          title="Tabelas de Preço"
          value={priceTables.length}
          icon={DollarSign}
          description="Configuradas"
        />
        <StatsCard
          title="Famílias"
          value={families.length}
          icon={Tag}
          description="Categorias ativas"
        />
        <StatsCard
          title="Página"
          value={`${currentPage}/${totalPages}`}
          icon={BarChart3}
          description="Navegação"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="produtos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="produtos">
            <Package className="mr-2 h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="precos">
            <DollarSign className="mr-2 h-4 w-4" />
            Tabelas de Preço
          </TabsTrigger>
          <TabsTrigger value="familias">
            <Tag className="mr-2 h-4 w-4" />
            Famílias
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="produtos">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Catálogo de Produtos</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, SKU ou NCM..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="Nenhum produto encontrado"
                  description="Configure as credenciais Omie para carregar o catálogo"
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>NCM</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product: any, idx: number) => (
                        <TableRow key={product.codigo_produto || idx}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {product.codigo || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate font-medium">
                            {product.descricao || "Sem descrição"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {product.ncm || "—"}
                          </TableCell>
                          <TableCell>{product.unidade || "UN"}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(product.valor_unitario)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSyncProduct(product)}
                            >
                              <Upload className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Próxima
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Tables Tab */}
        <TabsContent value="precos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tabelas de Preço</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPrices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : priceTables.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="Nenhuma tabela de preços"
                  description="As tabelas de preço do Omie serão listadas aqui"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceTables.map((table: any, idx: number) => (
                      <TableRow key={table.nCodTabPreco || idx}>
                        <TableCell className="font-mono text-xs">
                          {table.nCodTabPreco}
                        </TableCell>
                        <TableCell className="font-medium">
                          {table.cNome || "Sem nome"}
                        </TableCell>
                        <TableCell>{table.cTipo || "—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={table.cAtiva === "S" ? "default" : "secondary"}
                          >
                            {table.cAtiva === "S" ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Families Tab */}
        <TabsContent value="familias">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Famílias de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              {families.length === 0 ? (
                <EmptyState
                  icon={Tag}
                  title="Nenhuma família cadastrada"
                  description="As famílias/categorias do Omie serão listadas aqui"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {families.map((fam: any, idx: number) => (
                      <TableRow key={fam.codFamilia || idx}>
                        <TableCell className="font-mono text-xs">
                          {fam.codFamilia}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fam.nomeFamilia || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={fam.inativo === "N" ? "default" : "secondary"}>
                            {fam.inativo === "N" ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 rounded-full bg-muted p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
