import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Loader2 } from "lucide-react";

interface ComprasPedidosProps {
  pedList: any[];
  loading: boolean;
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-medium text-muted-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>}
    </div>
  );
}

export function ComprasPedidos({ pedList, loading }: ComprasPedidosProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Pedidos de Compra</CardTitle><CardDescription>Pedidos enviados aos fornecedores</CardDescription></CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : pedList.length === 0 ? (
          <EmptyState icon={Truck} title="Nenhum pedido de compra" description="Pedidos do Omie aparecerão aqui" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Pedido</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedList.map((p: any, idx: number) => {
                const cab = p.cabecalho || p;
                return (
                  <TableRow key={cab.nCodPedido || idx}>
                    <TableCell className="font-medium">{cab.nNumeroPedido || cab.nCodPedido || "-"}</TableCell>
                    <TableCell>{cab.nCodFornec || cab.codigo_fornecedor || "-"}</TableCell>
                    <TableCell>{cab.dDtPedido || cab.data || "-"}</TableCell>
                    <TableCell><Badge variant="outline">{cab.cEtapa || "-"}</Badge></TableCell>
                    <TableCell className="text-right font-medium">R$ {Number(cab.nValorTotal || cab.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
