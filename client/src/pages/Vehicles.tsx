import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useVehicles, useCreateVehicle } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Plus, Truck, Calendar, Hash, MoreVertical, Gauge, Settings2, ShieldCheck, AlertCircle } from "lucide-react";
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
import { insertVehicleSchema } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function CreateVehicleForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateVehicle();
  
  const form = useForm<z.infer<typeof insertVehicleSchema>>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      type: "TRUCK_3X4",
      status: "ACTIVE",
      year: new Date().getFullYear(),
      nickname: "",
      plate: "",
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data, { onSuccess }))} className="space-y-5">
        <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Identificação (Apelido)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Mercedes-Benz Accelo 1016" className="bg-background border-border" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Placa (Mercosul)</FormLabel>
                <FormControl>
                  <Input placeholder="ABC1D23" className="bg-background border-border font-mono uppercase" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ano Fabricação</FormLabel>
                <FormControl>
                  <Input type="number" className="bg-background border-border" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Categoria do Veículo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TRUCK_3X4">Caminhão 3/4</SelectItem>
                    <SelectItem value="FIORINO">Fiorino / Van</SelectItem>
                    <SelectItem value="OTHER">Outros Modelos</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <Button type="submit" className="w-full font-bold h-12 shadow-lg shadow-primary/20" disabled={isPending}>
          {isPending ? "Processando Cadastro..." : "Salvar Veículo na Frota"}
        </Button>
      </form>
    </Form>
  );
}

export default function Vehicles() {
  const [open, setOpen] = useState(false);
  const { data: vehicles, isLoading } = useVehicles();

  return (
    <Layout>
      <div className="mb-8 bg-card border border-border/80 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mb-1">Frota de Veículos</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
               <Truck className="w-4 h-4" />
               Gerenciamento de ativos rodoviários AF Silva
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold shadow-md shadow-primary/10 transition-all hover:shadow-primary/20 px-6">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-display font-bold">Novo Ativo da Frota</DialogTitle>
                <DialogDescription>Cadastre as especificações técnicas do novo veículo.</DialogDescription>
              </DialogHeader>
              <CreateVehicleForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-card border border-border/50 rounded-xl animate-pulse" />
          ))
        ) : vehicles?.map((vehicle) => (
          <Card key={vehicle.id} className="group hover:shadow-xl transition-all duration-300 border-border/80 overflow-hidden relative">
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full transition-all group-hover:w-2",
              vehicle.status === "ACTIVE" ? "bg-green-500" : "bg-slate-400"
            )} />
            
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
               <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-background font-bold text-[10px] tracking-widest border-border/80 text-muted-foreground">
                    {vehicle.type === 'TRUCK_3X4' ? 'CAMINHÃO 3/4' : vehicle.type === 'FIORINO' ? 'VAN / FIORINO' : 'ESPECIAL'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
               </div>
               <CardTitle className="text-xl font-display font-bold text-foreground mt-2 truncate leading-tight">
                {vehicle.nickname}
               </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Placa</span>
                 </div>
                 <span className="font-mono bg-sidebar text-sidebar-foreground px-2.5 py-1 rounded text-xs font-bold tracking-widest shadow-sm">
                   {vehicle.plate}
                 </span>
              </div>
              
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Ano</span>
                 </div>
                 <span className="text-sm font-bold text-foreground">{vehicle.year}</span>
              </div>

              <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground font-medium">
                 <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                 <span>Documentação em dia</span>
              </div>
            </CardContent>

            <CardFooter className="pt-2 pb-5 flex items-center justify-between bg-muted/5 border-t border-border/50">
               <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    vehicle.status === "ACTIVE" ? "bg-green-500" : "bg-slate-400"
                  )} />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                    {vehicle.status === "ACTIVE" ? "Disponível" : "Inativo"}
                  </span>
               </div>
               <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase border-border/80 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                  Detalhes
               </Button>
            </CardFooter>
          </Card>
        ))}
        {vehicles?.length === 0 && !isLoading && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-border/80 rounded-xl bg-muted/10">
             <div className="bg-muted/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="w-10 h-10 text-muted-foreground opacity-40" />
             </div>
             <h3 className="text-xl font-bold text-foreground mb-2">Frota Vazia</h3>
             <p className="text-muted-foreground max-w-[300px] mx-auto text-sm">
               Nenhum veículo registrado na base operacional AF Silva Transportes.
             </p>
             <Button variant="outline" className="mt-8 border-dashed" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro veículo
             </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
