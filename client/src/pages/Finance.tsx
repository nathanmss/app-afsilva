import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useFinanceTransactions, useCreateTransaction } from "@/hooks/use-finance";
import { useCategories } from "@/hooks/use-categories";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Receipt } from "lucide-react";
import { format } from "date-fns";
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
import { insertFinanceTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Create Form Component
function CreateTransactionForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateTransaction();
  const { data: categories } = useCategories();
  
  const form = useForm<z.infer<typeof insertFinanceTransactionSchema>>({
    resolver: zodResolver(insertFinanceTransactionSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: "0",
      description: "",
      date: new Date(),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data, { onSuccess }))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Lançamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INCOME">Receita</SelectItem>
                    <SelectItem value="EXPENSE">Despesa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(Number(val))} 
                  defaultValue={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
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
              <FormLabel>Descrição / Histórico</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Competência</FormLabel>
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

        <Button type="submit" className="w-full font-semibold" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </form>
    </Form>
  );
}

export default function Finance() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const { data: transactions, isLoading } = useFinanceTransactions({ month });

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Gestão de receitas e despesas</p>
        </div>
        
        <div className="flex items-center gap-2">
           <Input 
             type="month" 
             value={month} 
             onChange={(e) => setMonth(e.target.value)} 
             className="w-40 bg-background"
           />
           <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lançamento Financeiro</DialogTitle>
              </DialogHeader>
              <CreateTransactionForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Histórico</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando dados...</TableCell>
               </TableRow>
            ) : transactions?.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center py-12">
                   <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                   <h3 className="text-lg font-bold text-foreground">Nenhuma transação encontrada</h3>
                   <p className="text-muted-foreground mt-1">Não há lançamentos financeiros para este período.</p>
                 </TableCell>
               </TableRow>
            ) : (
              transactions?.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-muted-foreground">{format(new Date(t.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{t.description || "—"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border/50">
                      {t.category?.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-bold text-xs uppercase tracking-wide",
                      t.type === "INCOME" ? "text-green-600" : "text-red-600"
                    )}>
                      {t.type === "INCOME" ? "RECEITA" : "DESPESA"}
                    </span>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono font-medium",
                    t.type === "INCOME" ? "text-green-600" : "text-red-600"
                  )}>
                    {t.type === "INCOME" ? "+" : "-"}R$ {Number(t.amount).toFixed(2).replace('.', ',')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}