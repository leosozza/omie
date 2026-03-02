import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Loader2 } from "lucide-react";

interface ComprasEntradasProps {
  notasList: any[];
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

export function ComprasEntradas({ notasList, loading }: ComprasEntradasProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Notas de Entrada</CardTitle><CardDescription>Recebimento de mercadorias</CardDescription></CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : notasList.length === 0 ? (
          <EmptyState icon={Package} title="Nenhuma nota de entrada" description="Notas de entrada do Omie aparecerão aqui" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº NF</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasList.map((n: any, idx: number) => (
                <TableRow key={n.nCodNFe || idx}>
                  <TableCell className="font-medium">{n.nNF || n.numero_nf || "-"}</TableCell>
                  <TableCell>{n.nCodFornec || n.codigo_fornecedor || "-"}</TableCell>
                  <TableCell>{n.dDtEmissao || n.data_emissao || "-"}</TableCell>
                  <TableCell className="text-right font-medium">R$ {Number(n.nValorTotal || n.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
