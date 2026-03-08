import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useVehicles, useCreateVehicle } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Plus, Truck, Calendar, Hash } from "lucide-react";
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
import { insertVehicleSchema } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <form onSubmit={form.handleSubmit((data) => mutate(data, { onSuccess }))} className="space-y-4">
        <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome / Apelido do Veículo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Caminhão Baú 01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input placeholder="ABC-1234" {...field} />
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
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                <FormLabel>Tipo de Veículo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TRUCK_3X4">Caminhão 3/4</SelectItem>
                    <SelectItem value="FIORINO">Fiorino / Van</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <Button type="submit" className="w-full font-semibold" disabled={isPending}>
          {isPending ? "Cadastrando..." : "Cadastrar Veículo"}
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Veículos</h1>
          <p className="text-muted-foreground">Gestão da frota operacional</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Veículo</DialogTitle>
            </DialogHeader>
            <CreateVehicleForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando frota...</p>
        ) : vehicles?.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-lg font-bold">{vehicle.nickname}</CardTitle>
               <Truck className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="w-4 h-4" />
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground font-medium">{vehicle.plate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{vehicle.year} • {vehicle.type === 'TRUCK_3X4' ? 'Caminhão 3/4' : vehicle.type === 'FIORINO' ? 'Fiorino' : 'Outro'}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Badge variant={vehicle.status === "ACTIVE" ? "default" : "secondary"}>
                {vehicle.status === "ACTIVE" ? "ATIVO" : vehicle.status}
              </Badge>
            </CardFooter>
          </Card>
        ))}
        {vehicles?.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
             <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
             <h3 className="text-lg font-bold text-foreground">Nenhum veículo encontrado</h3>
             <p className="text-muted-foreground mt-1">Cadastre o primeiro veículo da frota para começar.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
