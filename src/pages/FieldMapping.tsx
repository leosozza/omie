import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { BITRIX_ENTITIES, OMIE_ENTITIES, MAPPING_DIRECTIONS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeftRight,
  ArrowLeft,
  Loader2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type FieldMapping = Database["public"]["Tables"]["field_mappings"]["Row"];

export default function FieldMapping() {
  const { memberId } = useTenant();
  const queryClient = useQueryClient();
  
  const [selectedBitrixEntity, setSelectedBitrixEntity] = useState<string>("deal");
  const [selectedOmieEntity, setSelectedOmieEntity] = useState<string>("pedido");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // New mapping form state
  const [newMapping, setNewMapping] = useState({
    omie_field_code: "",
    omie_field_name: "",
    bitrix_field_code: "",
    bitrix_field_name: "",
    direction: "bidirectional" as string,
  });

  // Fetch existing mappings
  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["field-mappings", memberId, selectedBitrixEntity, selectedOmieEntity],
    queryFn: async () => {
      const query = supabase
        .from("field_mappings")
        .select("*")
        .eq("bitrix_entity", selectedBitrixEntity as Database["public"]["Enums"]["bitrix_entity"])
        .eq("omie_entity", selectedOmieEntity)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (memberId) {
        query.eq("tenant_id", memberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Add mapping mutation
  const addMappingMutation = useMutation({
    mutationFn: async (mapping: typeof newMapping) => {
      const { error } = await supabase.from("field_mappings").insert({
        tenant_id: memberId || "demo",
        bitrix_entity: selectedBitrixEntity as "lead" | "deal" | "contact" | "company" | "spa",
        omie_entity: selectedOmieEntity,
        omie_field_code: mapping.omie_field_code,
        omie_field_name: mapping.omie_field_name,
        bitrix_field_code: mapping.bitrix_field_code,
        bitrix_field_name: mapping.bitrix_field_name,
        direction: mapping.direction as any,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-mappings"] });
      toast.success("Mapeamento adicionado com sucesso!");
      setIsAddDialogOpen(false);
      setNewMapping({
        omie_field_code: "",
        omie_field_name: "",
        bitrix_field_code: "",
        bitrix_field_name: "",
        direction: "bidirectional",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar mapeamento");
    },
  });

  // Delete mapping mutation
  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("field_mappings")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-mappings"] });
      toast.success("Mapeamento removido");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover mapeamento");
    },
  });

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "omie_to_bitrix":
        return <ArrowRight className="h-4 w-4" />;
      case "bitrix_to_omie":
        return <ArrowLeft className="h-4 w-4" />;
      default:
        return <ArrowLeftRight className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mapeamento de Campos
          </h1>
          <p className="text-muted-foreground">
            Configure como os campos são sincronizados entre Bitrix24 e Omie
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Novo Mapeamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Mapeamento</DialogTitle>
              <DialogDescription>
                Configure um novo mapeamento entre campos do Bitrix24 e Omie
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código Campo Omie</Label>
                  <Input
                    placeholder="ex: razao_social"
                    value={newMapping.omie_field_code}
                    onChange={(e) => setNewMapping({ ...newMapping, omie_field_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome Campo Omie</Label>
                  <Input
                    placeholder="ex: Razão Social"
                    value={newMapping.omie_field_name}
                    onChange={(e) => setNewMapping({ ...newMapping, omie_field_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código Campo Bitrix</Label>
                  <Input
                    placeholder="ex: COMPANY_TITLE"
                    value={newMapping.bitrix_field_code}
                    onChange={(e) => setNewMapping({ ...newMapping, bitrix_field_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome Campo Bitrix</Label>
                  <Input
                    placeholder="ex: Nome da Empresa"
                    value={newMapping.bitrix_field_name}
                    onChange={(e) => setNewMapping({ ...newMapping, bitrix_field_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Direção do Mapeamento</Label>
                <Select
                  value={newMapping.direction}
                  onValueChange={(value) => setNewMapping({ ...newMapping, direction: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAPPING_DIRECTIONS.map((dir) => (
                      <SelectItem key={dir.value} value={dir.value}>
                        {dir.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => addMappingMutation.mutate(newMapping)}
                disabled={addMappingMutation.isPending || !newMapping.omie_field_code || !newMapping.bitrix_field_code}
              >
                {addMappingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Entity Selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Selecione as Entidades
          </CardTitle>
          <CardDescription>
            Escolha quais entidades você deseja mapear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label>Entidade Bitrix24</Label>
              <Select value={selectedBitrixEntity} onValueChange={setSelectedBitrixEntity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BITRIX_ENTITIES.map((entity) => (
                    <SelectItem key={entity.value} value={entity.value}>
                      {entity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end pb-2">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-2">
              <Label>Entidade Omie</Label>
              <Select value={selectedOmieEntity} onValueChange={setSelectedOmieEntity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OMIE_ENTITIES.map((entity) => (
                    <SelectItem key={entity.value} value={entity.value}>
                      {entity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" className="mb-0.5">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeamentos Configurados</CardTitle>
          <CardDescription>
            {mappings.length} mapeamento(s) para{" "}
            {BITRIX_ENTITIES.find((e) => e.value === selectedBitrixEntity)?.label} ↔{" "}
            {OMIE_ENTITIES.find((e) => e.value === selectedOmieEntity)?.label}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : mappings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitBranch className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold text-foreground">
                Nenhum mapeamento configurado
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Clique em "Novo Mapeamento" para começar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo Omie</TableHead>
                  <TableHead className="text-center">Direção</TableHead>
                  <TableHead>Campo Bitrix24</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mapping.omie_field_name || mapping.omie_field_code}</p>
                        <code className="text-xs text-muted-foreground">{mapping.omie_field_code}</code>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getDirectionIcon(mapping.direction || "bidirectional")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mapping.bitrix_field_name || mapping.bitrix_field_code}</p>
                        <code className="text-xs text-muted-foreground">{mapping.bitrix_field_code}</code>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={mapping.is_custom_field ? "secondary" : "outline"}>
                        {mapping.is_custom_field ? "Custom" : "Padrão"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMappingMutation.mutate(mapping.id)}
                        disabled={deleteMappingMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
