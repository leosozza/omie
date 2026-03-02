import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Loader2, Search } from "lucide-react";
import { useState } from "react";

interface ComprasRequisicoesProps {
  reqList: any[];
  loading: boolean;
  memberId: string | null;
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

export function ComprasRequisicoes({ reqList, loading, memberId }: ComprasRequisicoesProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Requisições de Compra</CardTitle><CardDescription>Solicitações cadastradas no Omie</CardDescription></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !memberId ? (
          <EmptyState icon={FileText} title="Acesse pelo Bitrix24" />
        ) : reqList.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhuma requisição encontrada" description="Requisições do Omie aparecerão aqui" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reqList.filter((r: any) => {
                if (!searchTerm) return true;
                const s = searchTerm.toLowerCase();
                return (r.nCodReq?.toString() || "").includes(s) || (r.cDescricao || r.descricao || "").toLowerCase().includes(s);
              }).map((r: any, idx: number) => (
                <TableRow key={r.nCodReq || idx}>
                  <TableCell className="font-medium">{r.nCodReq || r.codigo || "-"}</TableCell>
                  <TableCell>{r.cDescricao || r.descricao || "-"}</TableCell>
                  <TableCell>{r.dDtReq || r.data || "-"}</TableCell>
                  <TableCell><Badge variant="outline">{r.cStatus || r.status || "-"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
