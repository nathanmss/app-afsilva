import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useLoadings, useCreateLoading, useUpdateLoading } from "@/hooks/use-loadings";
import { useVehicles } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Package, Truck, Calendar, ArrowRightLeft, FileCheck, AlertCircle, TrendingUp, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manageLoadingSchema, USER_ROLES } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function LoadingForm({
  onSuccess,
  initialValues,
  loadingId,
}: {
  onSuccess: () => void;
  initialValues?: z.infer<typeof manageLoadingSchema>;
  loadingId?: number;
}) {
  const { mutate: createLoading, isPending: isCreating } = useCreateLoading();
  const { mutate: updateLoading, isPending: isUpdating } = useUpdateLoading();
  const { data: vehicles } = useVehicles();
  const isPending = isCreating || isUpdating;
  
  const form = useForm<z.infer<typeof manageLoadingSchema>>({
    resolver: zodResolver(manageLoadingSchema),
    defaultValues: initialValues ?? {
      type: "URBAN",
      grossFreight: "0",
      description: "",
      date: new Date(),
    },
  });

  function onSubmit(data: z.infer<typeof manageLoadingSchema>) {
    if (loadingId) {
      updateLoading({ id: loadingId, data }, { onSuccess });
      return;
    }

    createLoading(data, { onSuccess });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Veículo / Placa</FormLabel>
                <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value ? String(field.value) : undefined}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles?.map(v => (
                       <SelectItem key={v.id} value={String(v.id)} className="font-medium">
                        {v.nickname} <span className="text-muted-foreground font-mono ml-2 text-xs">[{v.plate}]</span>
                       </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tipo de Operação</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="URBAN">Distribuição Urbana</SelectItem>
                    <SelectItem value="TRIP">Viagem Rodoviária</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Data da Saída</FormLabel>
                <FormControl>
                   <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input 
                        type="date" 
                        className="pl-10 bg-background border-border"
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                   </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
            control={form.control}
            name="grossFreight"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Valor do Frete Bruto (R$)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
                    <Input type="number" step="0.01" className="pl-10 bg-background border-border font-mono text-lg font-bold" placeholder="0,00" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Observações de Campo</FormLabel>
              <FormControl>
                <Input className="bg-background border-border" {...field} value={field.value ?? ""} placeholder="Ex: Carga frágil, cliente XYZ" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full font-bold h-12 shadow-lg shadow-primary/20" disabled={isPending}>
          {isPending ? "Processando..." : loadingId ? "Confirmar Alterações" : "Emitir Romaneio"}
        </Button>
      </form>
    </Form>
  );
}

export default function Loadings() {
  const [open, setOpen] = useState(false);
  const [editingLoadingId, setEditingLoadingId] = useState<number | null>(null);
  const { data: loadings, isLoading } = useLoadings();
  const { user } = useAuth();
  const editingLoading = loadings?.find((loading) => loading.id === editingLoadingId);
  const canSeeEstimatedRevenue = user?.role === USER_ROLES.ADMIN;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const editingInitialValues = editingLoading
    ? {
        vehicleId: editingLoading.vehicleId,
        date: new Date(editingLoading.date),
        type: editingLoading.type,
        grossFreight: String(editingLoading.grossFreight),
        description: editingLoading.description ?? "",
      }
    : undefined;

  return (
    <Layout>
      <div className="mb-8 bg-card border border-border/80 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mb-1">Operações de Carga</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
               <Package className="w-4 h-4" />
               Registro e controle de romaneios de frete
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold shadow-md shadow-primary/10 transition-all hover:shadow-primary/20 px-6">
                <Plus className="w-5 h-5 mr-2" />
                Nova Operação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-display font-bold">Lançamento de Romaneio</DialogTitle>
                <DialogDescription>Insira os dados da viagem para cálculo de receita estimada.</DialogDescription>
              </DialogHeader>
              <LoadingForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={editingLoadingId !== null} onOpenChange={(nextOpen) => !nextOpen && setEditingLoadingId(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-display font-bold">Corrigir Romaneio</DialogTitle>
            <DialogDescription>Ajuste as informações da carga selecionada.</DialogDescription>
          </DialogHeader>
          {editingInitialValues ? (
            <LoadingForm
              loadingId={editingLoadingId ?? undefined}
              initialValues={editingInitialValues}
              onSuccess={() => setEditingLoadingId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/80">
               <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider py-4 pl-6">Data</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Veículo Operador</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Tipo de Operação</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider py-4">Frete Bruto</TableHead>
                  {canSeeEstimatedRevenue ? (
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider py-4 text-primary">Receita Líquida</TableHead>
                  ) : null}
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider py-4 pr-6">Ações</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={canSeeEstimatedRevenue ? 6 : 5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <span className="text-sm font-medium text-muted-foreground">Buscando romaneios...</span>
                       </div>
                    </TableCell>
                  </TableRow>
               ) : loadings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canSeeEstimatedRevenue ? 6 : 5} className="py-24 text-center">
                      <div className="bg-muted/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-10 h-10 text-muted-foreground opacity-40" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Sem movimentação de cargas</h3>
                      <p className="text-muted-foreground max-w-[300px] mx-auto text-sm">
                        O histórico operacional está aguardando o primeiro lançamento.
                      </p>
                      <Button variant="outline" className="mt-8 border-dashed" onClick={() => setOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Registrar primeiro romaneio
                      </Button>
                    </TableCell>
                  </TableRow>
               ) : loadings?.map(l => (
                  <TableRow key={l.id} className="group hover:bg-muted/40 transition-colors border-b border-border/50">
                     <TableCell className="py-4 pl-6">
                       <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm">{format(new Date(l.date), "dd/MM")}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">{format(new Date(l.date), "EEEE", { locale: ptBR })}</span>
                       </div>
                     </TableCell>
                     <TableCell className="py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                             <Truck className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-sm text-foreground">{l.vehicle?.nickname}</span>
                             <span className="font-mono text-[10px] text-muted-foreground uppercase">{l.vehicle?.plate}</span>
                          </div>
                       </div>
                     </TableCell>
                     <TableCell className="py-4">
                        <Badge variant="outline" className={cn(
                          "font-bold text-[10px] tracking-widest px-2 py-0.5",
                          l.type === "URBAN" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200"
                        )}>
                          {l.type === "URBAN" ? "DISTRIBUIÇÃO URBANA" : "VIAGEM RODoviária"}
                        </Badge>
                     </TableCell>
                     <TableCell className="text-right py-4 font-mono font-medium text-muted-foreground text-sm">
                        {formatCurrency(Number(l.grossFreight))}
                     </TableCell>
                     {canSeeEstimatedRevenue ? (
                       <TableCell className="text-right py-4 font-mono font-bold text-primary text-sm">
                          <div className="flex items-center justify-end gap-1.5">
                             <TrendingUp className="w-3.5 h-3.5" />
                             {formatCurrency(Number(l.estimatedRevenue))}
                          </div>
                       </TableCell>
                     ) : null}
                     <TableCell className="text-right py-4 pr-6">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingLoadingId(l.id)}
                        className="h-8 text-[11px] font-bold uppercase hover:bg-primary/10 hover:text-primary"
                       >
                         <Pencil className="w-3.5 h-3.5 mr-2" />
                         Corrigir
                       </Button>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
          </Table>
        </div>
        <div className="bg-muted/10 p-4 border-t border-border/80 flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-green-600" /> Romaneios Conferidos
              </span>
           </div>
           <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              <span>Dados sujeitos a conferência fiscal</span>
           </div>
        </div>
      </Card>
    </Layout>
  );
}
