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
import { Plus, Filter, Receipt, ArrowUpCircle, ArrowDownCircle, Search, Calendar } from "lucide-react";
import { format } from "date-fns";
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
import { insertFinanceTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
      <form onSubmit={form.handleSubmit((data) => mutate(data, { onSuccess }))} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tipo de Fluxo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-border focus:ring-primary/20">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INCOME" className="text-green-600 font-medium">Entrada (Receita)</SelectItem>
                    <SelectItem value="EXPENSE" className="text-red-600 font-medium">Saída (Despesa)</SelectItem>
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
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Categoria Contábil</FormLabel>
                <Select 
                  onValueChange={(val) => field.onChange(Number(val))} 
                  defaultValue={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background border-border focus:ring-primary/20">
                      <SelectValue placeholder="Selecione" />
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
              <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Valor Bruto (R$)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">R$</span>
                  <Input type="number" step="0.01" className="pl-10 bg-background border-border font-mono text-lg" placeholder="0,00" {...field} />
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
              <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Descrição do Histórico</FormLabel>
              <FormControl>
                <Input className="bg-background border-border" placeholder="Ex: Pagamento Fornecedor X" {...field} value={field.value ?? ""} />
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
              <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Data da Operação</FormLabel>
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

        <Button type="submit" className="w-full font-bold h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]" disabled={isPending}>
          {isPending ? "Processando..." : "Confirmar Lançamento"}
        </Button>
      </form>
    </Form>
  );
}

export default function Finance() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const { data: transactions, isLoading } = useFinanceTransactions({ month });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <Layout>
      <div className="mb-8 bg-card border border-border/80 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mb-1">Livro Caixa</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
               <Receipt className="w-4 h-4" />
               Controle de fluxo financeiro operacional
            </p>
          </div>
          
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
             <div className="relative group flex-1 sm:flex-none">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
               <Input 
                 type="month" 
                 value={month} 
                 onChange={(e) => setMonth(e.target.value)} 
                 className="pl-10 w-full sm:w-48 bg-background border-border shadow-sm focus:ring-primary/20"
               />
             </div>
             
             <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold shadow-md shadow-primary/10 transition-all hover:shadow-primary/20 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-display font-bold">Lançamento Financeiro</DialogTitle>
                  <DialogDescription>Insira os detalhes da entrada ou saída do caixa.</DialogDescription>
                </DialogHeader>
                <CreateTransactionForm onSuccess={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px] font-semibold text-xs uppercase tracking-wider py-4">Data</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Histórico / Descrição</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Categoria</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Natureza</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider py-4 pr-6">Valor Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-20">
                     <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground">Carregando transações...</span>
                     </div>
                   </TableCell>
                 </TableRow>
              ) : transactions?.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-24">
                     <div className="bg-muted/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Receipt className="w-10 h-10 text-muted-foreground opacity-40" />
                     </div>
                     <h3 className="text-xl font-bold text-foreground mb-2">Sem movimentações</h3>
                     <p className="text-muted-foreground max-w-[300px] mx-auto text-sm">
                       Não identificamos lançamentos financeiros para o período selecionado.
                     </p>
                     <Button variant="outline" className="mt-6 border-dashed" onClick={() => setOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar primeiro registro
                     </Button>
                   </TableCell>
                 </TableRow>
              ) : (
                transactions?.map((t) => (
                  <TableRow key={t.id} className="group hover:bg-muted/40 transition-colors border-b border-border/50">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{format(new Date(t.date), "dd/MM/yyyy")}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">{format(new Date(t.date), "EEEE", { locale: ptBR })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="font-medium text-foreground max-w-[300px] truncate">{t.description || "Sem descrição"}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-background font-medium border-border/80 text-muted-foreground px-2 py-0">
                        {t.category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className={cn(
                        "flex items-center gap-2 font-bold text-[11px] tracking-widest",
                        t.type === "INCOME" ? "text-green-600" : "text-red-600"
                      )}>
                        {t.type === "INCOME" ? (
                          <><ArrowUpCircle className="w-4 h-4" /> ENTRADA</>
                        ) : (
                          <><ArrowDownCircle className="w-4 h-4" /> SAÍDA</>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right py-4 pr-6 font-mono font-bold text-sm",
                      t.type === "INCOME" ? "text-green-600" : "text-red-600"
                    )}>
                      {t.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="bg-muted/10 p-4 border-t border-border/80 flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
           <span>Sistema de Controle AF Silva</span>
           <span>Página {Math.ceil((transactions?.length || 0) / 50)} de 1</span>
        </div>
      </Card>
    </Layout>
  );
}

// Add ptBR locale for the days of the week
import { ptBR } from "date-fns/locale";
