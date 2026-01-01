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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  RefreshCw,
  Zap,
  Database,
  Search
} from "lucide-react";
import { toast } from "sonner";
import type { Database as SupabaseDatabase } from "@/integrations/supabase/types";

type FieldMapping = SupabaseDatabase["public"]["Tables"]["field_mappings"]["Row"];

interface DiscoveredField {
  field_code: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  is_custom?: boolean;
}

export default function FieldMapping() {
  const { memberId } = useTenant();
  const queryClient = useQueryClient();
  
  const [selectedBitrixEntity, setSelectedBitrixEntity] = useState<string>("deal");
  const [selectedOmieEntity, setSelectedOmieEntity] = useState<string>("pedido");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [bitrixFieldSearch, setBitrixFieldSearch] = useState("");
  const [omieFieldSearch, setOmieFieldSearch] = useState("");
  
  // New mapping form state
  const [newMapping, setNewMapping] = useState({
    omie_field_code: "",
    omie_field_name: "",
    bitrix_field_code: "",
    bitrix_field_name: "",
    direction: "bidirectional" as string,
    is_custom_field: false,
  });

  // Fetch existing mappings
  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["field-mappings", memberId, selectedBitrixEntity, selectedOmieEntity],
    queryFn: async () => {
      const query = supabase
        .from("field_mappings")
        .select("*")
        .eq("bitrix_entity", selectedBitrixEntity as SupabaseDatabase["public"]["Enums"]["bitrix_entity"])
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

  // Fetch cached Bitrix fields
  const { data: bitrixFields = [], isLoading: isBitrixFieldsLoading, refetch: refetchBitrixFields } = useQuery({
    queryKey: ["bitrix-cached-fields", memberId, selectedBitrixEntity],
    queryFn: async () => {
      const query = supabase
        .from("bitrix_cached_fields")
        .select("*")
        .eq("entity_type", selectedBitrixEntity as SupabaseDatabase["public"]["Enums"]["bitrix_entity"])
        .order("field_name");

      if (memberId) {
        query.eq("tenant_id", memberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DiscoveredField[];
    },
  });

  // Fetch cached Omie fields
  const { data: omieFields = [], isLoading: isOmieFieldsLoading, refetch: refetchOmieFields } = useQuery({
    queryKey: ["omie-cached-fields", memberId, selectedOmieEntity],
    queryFn: async () => {
      const query = supabase
        .from("omie_cached_fields")
        .select("*")
        .eq("entity_type", selectedOmieEntity)
        .order("field_name");

      if (memberId) {
        query.eq("tenant_id", memberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DiscoveredField[];
    },
  });

  // Discover Bitrix fields mutation
  const discoverBitrixMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("bitrix-discover-fields", {
        body: {
          memberId: memberId || "demo",
          entityType: selectedBitrixEntity,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bitrix-cached-fields"] });
      toast.success(`${data.count} campos Bitrix24 descobertos!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao descobrir campos Bitrix24");
    },
  });

  // Discover Omie fields mutation
  const discoverOmieMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("omie-discover-fields", {
        body: {
          memberId: memberId || "demo",
          entityType: selectedOmieEntity,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["omie-cached-fields"] });
      toast.success(`${data.count} campos Omie descobertos!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao descobrir campos Omie");
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
        direction: mapping.direction as SupabaseDatabase["public"]["Enums"]["mapping_direction"],
        is_custom_field: mapping.is_custom_field,
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
        is_custom_field: false,
      });
    },
    onError: (error: Error) => {
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
    onError: (error: Error) => {
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

  const selectBitrixField = (field: DiscoveredField) => {
    setNewMapping({
      ...newMapping,
      bitrix_field_code: field.field_code,
      bitrix_field_name: field.field_name,
      is_custom_field: field.is_custom || false,
    });
  };

  const selectOmieField = (field: DiscoveredField) => {
    setNewMapping({
      ...newMapping,
      omie_field_code: field.field_code,
      omie_field_name: field.field_name,
    });
  };

  const filteredBitrixFields = bitrixFields.filter(
    (f) =>
      f.field_name.toLowerCase().includes(bitrixFieldSearch.toLowerCase()) ||
      f.field_code.toLowerCase().includes(bitrixFieldSearch.toLowerCase())
  );

  const filteredOmieFields = omieFields.filter(
    (f) =>
      f.field_name.toLowerCase().includes(omieFieldSearch.toLowerCase()) ||
      f.field_code.toLowerCase().includes(omieFieldSearch.toLowerCase())
  );

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
          <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Adicionar Mapeamento</DialogTitle>
              <DialogDescription>
                Selecione os campos do Bitrix24 e Omie para criar um mapeamento
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              {/* Bitrix Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-500" />
                    Bitrix24
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => discoverBitrixMutation.mutate()}
                    disabled={discoverBitrixMutation.isPending}
                  >
                    {discoverBitrixMutation.isPending ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="mr-1 h-3 w-3" />
                    )}
                    Auto-Discovery
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar campo..."
                    value={bitrixFieldSearch}
                    onChange={(e) => setBitrixFieldSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <ScrollArea className="h-[300px] rounded-md border">
                  {isBitrixFieldsLoading || discoverBitrixMutation.isPending ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredBitrixFields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <Database className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique em "Auto-Discovery" para buscar campos
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredBitrixFields.map((field) => (
                        <div
                          key={field.field_code}
                          onClick={() => selectBitrixField(field)}
                          className={`p-2 rounded-md cursor-pointer transition-colors ${
                            newMapping.bitrix_field_code === field.field_code
                              ? "bg-primary/20 border border-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{field.field_name}</span>
                            {field.is_custom && (
                              <Badge variant="secondary" className="text-xs">Custom</Badge>
                            )}
                          </div>
                          <code className="text-xs text-muted-foreground">{field.field_code}</code>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
                            {field.is_required && (
                              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {newMapping.bitrix_field_code && (
                  <div className="p-2 bg-primary/10 rounded-md">
                    <p className="text-sm font-medium">Selecionado: {newMapping.bitrix_field_name}</p>
                    <code className="text-xs text-muted-foreground">{newMapping.bitrix_field_code}</code>
                  </div>
                )}
              </div>

              {/* Omie Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-500" />
                    Omie
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => discoverOmieMutation.mutate()}
                    disabled={discoverOmieMutation.isPending}
                  >
                    {discoverOmieMutation.isPending ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="mr-1 h-3 w-3" />
                    )}
                    Auto-Discovery
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar campo..."
                    value={omieFieldSearch}
                    onChange={(e) => setOmieFieldSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <ScrollArea className="h-[300px] rounded-md border">
                  {isOmieFieldsLoading || discoverOmieMutation.isPending ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredOmieFields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <Database className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique em "Auto-Discovery" para buscar campos
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredOmieFields.map((field) => (
                        <div
                          key={field.field_code}
                          onClick={() => selectOmieField(field)}
                          className={`p-2 rounded-md cursor-pointer transition-colors ${
                            newMapping.omie_field_code === field.field_code
                              ? "bg-primary/20 border border-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{field.field_name}</span>
                          </div>
                          <code className="text-xs text-muted-foreground">{field.field_code}</code>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
                            {field.is_required && (
                              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {newMapping.omie_field_code && (
                  <div className="p-2 bg-primary/10 rounded-md">
                    <p className="text-sm font-medium">Selecionado: {newMapping.omie_field_name}</p>
                    <code className="text-xs text-muted-foreground">{newMapping.omie_field_code}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Direction Selector */}
            <div className="space-y-2 border-t pt-4">
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

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => addMappingMutation.mutate(newMapping)}
                disabled={addMappingMutation.isPending || !newMapping.omie_field_code || !newMapping.bitrix_field_code}
              >
                {addMappingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Mapeamento
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

            <Button 
              variant="outline" 
              size="icon" 
              className="mb-0.5"
              onClick={() => {
                refetchBitrixFields();
                refetchOmieFields();
              }}
            >
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
