import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useLoadings, useCreateLoading, useUpdateLoading } from "@/hooks/use-loadings";
import { useVehicles } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value ? String(field.value) : undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles?.map(v => (
                       <SelectItem key={v.id} value={String(v.id)}>{v.nickname} ({v.plate})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Viagem</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="URBAN">Urbana</SelectItem>
                    <SelectItem value="TRIP">Rodoviária / Viagem</SelectItem>
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
                <FormLabel>Data</FormLabel>
                <FormControl>
                   <Input 
                      type="date" 
                      value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
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
                <FormLabel>Frete Bruto (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
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
              <FormLabel>Observação</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Informações adicionais do romaneio" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full font-semibold" disabled={isPending}>
          {isPending ? "Salvando..." : loadingId ? "Salvar Correção" : "Registrar Carga"}
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Cargas</h1>
          <p className="text-muted-foreground">Registro de viagens e fretes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Nova Carga
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Carga</DialogTitle>
            </DialogHeader>
            <LoadingForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editingLoadingId !== null} onOpenChange={(nextOpen) => !nextOpen && setEditingLoadingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corrigir Romaneio</DialogTitle>
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

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
             <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Frete Bruto</TableHead>
                {canSeeEstimatedRevenue ? <TableHead className="text-right">Receita Estimada</TableHead> : null}
                <TableHead className="text-right">Ações</TableHead>
             </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading ? (
                 <TableRow><TableCell colSpan={canSeeEstimatedRevenue ? 6 : 5} className="text-center py-8 text-muted-foreground">Carregando cargas...</TableCell></TableRow>
             ) : loadings?.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={canSeeEstimatedRevenue ? 6 : 5} className="text-center py-12">
                     <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                     <h3 className="text-lg font-bold text-foreground">Nenhuma carga registrada</h3>
                     <p className="text-muted-foreground mt-1">O histórico de fretes está vazio.</p>
                   </TableCell>
                 </TableRow>
             ) : loadings?.map(l => (
                 <TableRow key={l.id} className="hover:bg-muted/30">
                     <TableCell className="font-medium text-muted-foreground">{format(new Date(l.date), "dd/MM")}</TableCell>
                     <TableCell className="font-medium">{l.vehicle?.nickname}</TableCell>
                     <TableCell>
                       <span className="text-xs font-bold uppercase tracking-wide bg-secondary text-secondary-foreground border border-border/50 px-2 py-1 rounded">
                         {l.type === "URBAN" ? "URBANA" : "VIAGEM"}
                       </span>
                     </TableCell>
                     <TableCell className="text-right font-mono text-muted-foreground">R$ {Number(l.grossFreight).toFixed(2).replace('.', ',')}</TableCell>
                     {canSeeEstimatedRevenue ? (
                       <TableCell className="text-right font-mono font-bold text-green-600">R$ {Number(l.estimatedRevenue).toFixed(2).replace('.', ',')}</TableCell>
                     ) : null}
                     <TableCell className="text-right">
                       <Button variant="ghost" size="sm" onClick={() => setEditingLoadingId(l.id)}>
                         <Pencil className="w-4 h-4 mr-2" />
                         Corrigir
                       </Button>
                     </TableCell>
                 </TableRow>
             ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
