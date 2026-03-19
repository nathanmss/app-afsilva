import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useCreateInvoice, useExtractInvoiceDraft, useInvoices } from "@/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Link2, Plus, Upload, Search, Calendar, Filter, X, FileCheck, CheckCircle2, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema, INVOICE_PERIODS, INVOICE_STATUS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";
import { cn } from "@/lib/utils";

const invoiceFormSchema = insertInvoiceSchema.omit({ attachmentId: true });

function getDefaultPeriodType() {
  return new Date().getDate() <= 15 ? INVOICE_PERIODS.A_01_15 : INVOICE_PERIODS.B_16_END;
}

function CreateInvoiceForm({
  onSuccess,
}: {
  onSuccess: (invoice: z.infer<typeof insertInvoiceSchema>) => void;
}) {
  const { toast } = useToast();
  const { mutateAsync: extractInvoiceDraft, isPending: isExtracting } = useExtractInvoiceDraft();
  const { mutateAsync: createInvoice, isPending: isCreating } = useCreateInvoice();
  const [file, setFile] = useState<File | null>(null);
  const [attachmentId, setAttachmentId] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const isPending = isExtracting || isCreating;

  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      number: "",
      issueDate: new Date(),
      competenceMonth: format(new Date(), "yyyy-MM"),
      periodType: getDefaultPeriodType(),
      amount: "0",
      status: INVOICE_STATUS.ISSUED,
    },
  });

  async function onSubmit(values: z.infer<typeof invoiceFormSchema>) {
    if (!file || !attachmentId) {
      toast({
        title: "Leitura obrigatória",
        description: "Envie a nota fiscal e clique em 'Analisar Documento' antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const createdInvoice = await createInvoice({
      ...values,
      attachmentId,
      number: values.number?.trim() || null,
    });

    setFile(null);
    setAttachmentId(null);
    setWarnings([]);
    form.reset({
      number: "",
      issueDate: new Date(),
      competenceMonth: format(new Date(), "yyyy-MM"),
      periodType: getDefaultPeriodType(),
      amount: "0",
      status: INVOICE_STATUS.ISSUED,
    });
    onSuccess(createdInvoice);
  }

  async function handleExtract() {
    if (!file) {
      toast({
        title: "Anexo obrigatório",
        description: "Selecione o arquivo da nota fiscal para iniciar a leitura.",
        variant: "destructive",
      });
      return;
    }

    const extracted = await extractInvoiceDraft(file);
    setAttachmentId(extracted.attachment.id);
    setWarnings(extracted.warnings);

    if (extracted.draft.number) {
      form.setValue("number", extracted.draft.number);
    }
    if (extracted.draft.amount) {
      form.setValue("amount", extracted.draft.amount);
    }
    if (extracted.draft.issueDate) {
      form.setValue("issueDate", new Date(extracted.draft.issueDate));
    }
    if (extracted.draft.competenceMonth) {
      form.setValue("competenceMonth", extracted.draft.competenceMonth);
    }
    form.setValue("periodType", extracted.draft.periodType);
    form.setValue("status", extracted.draft.status);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/80">
          <FormLabel className="font-bold text-xs uppercase tracking-[0.1em] text-primary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            1. Anexar Documento Fiscal
          </FormLabel>
          <Input
            type="file"
            className="bg-background border-border"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setAttachmentId(null);
              setWarnings([]);
            }}
          />
          <p className="text-[11px] text-muted-foreground font-medium italic">
            Formatos suportados: PDF, PNG ou JPG. O sistema extrai os dados via OCR.
          </p>
          <Button type="button" variant="secondary" className="w-full font-bold h-10 shadow-sm border border-border/50" disabled={isPending || !file} onClick={handleExtract}>
            {isExtracting ? (
              <><span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2" /> Analisando Nota...</>
            ) : "Analisar Documento"}
          </Button>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Atenção na Conferência</span>
            </div>
            {warnings.map((warning) => (
              <p key={warning} className="font-medium opacity-80 leading-relaxed">• {warning}</p>
            ))}
          </div>
        )}

        <div className="space-y-4">
           <FormLabel className="font-bold text-xs uppercase tracking-[0.1em] text-primary flex items-center gap-2">
             <FileCheck className="w-4 h-4" />
             2. Validar Dados Extraídos
           </FormLabel>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Número da NF</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 000123" className="bg-background border-border font-mono font-bold" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Valor Total (R$)</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xs">R$</span>
                       <Input type="number" step="0.01" className="pl-9 bg-background border-border font-mono font-bold text-lg" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Data de Emissão</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="date"
                        className="pl-10 bg-background border-border"
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                        onChange={(event) => field.onChange(new Date(event.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="competenceMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Mês de Competência</FormLabel>
                  <FormControl>
                    <Input type="month" className="bg-background border-border font-medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="periodType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Período Fiscal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={INVOICE_PERIODS.A_01_15}>Quinzena A (01 a 15)</SelectItem>
                      <SelectItem value={INVOICE_PERIODS.B_16_END}>Quinzena B (16 ao fim)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status Atual</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={INVOICE_STATUS.ISSUED}>Emitida</SelectItem>
                      <SelectItem value={INVOICE_STATUS.SENT}>Enviada</SelectItem>
                      <SelectItem value={INVOICE_STATUS.PAID}>Paga / Liquidada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full font-bold h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" disabled={isPending}>
          {isPending ? "Gravando Documento..." : "Salvar e Vincular Nota Fiscal"}
        </Button>
      </form>
    </Form>
  );
}

function getInvoiceStatusLabel(status: string) {
  switch (status) {
    case INVOICE_STATUS.PAID:
      return "PAGA";
    case INVOICE_STATUS.SENT:
      return "ENVIADA";
    default:
      return "EMITIDA";
  }
}

function getInvoicePeriodLabel(periodType: string) {
  return periodType === INVOICE_PERIODS.A_01_15 ? "1ª Quinzena" : "2ª Quinzena";
}

export default function Invoices() {
  const [open, setOpen] = useState(false);
  const [competenceMonth, setCompetenceMonth] = useState("");
  const [periodType, setPeriodType] = useState<"ALL" | "A_01_15" | "B_16_END">("ALL");
  const { data: invoices, isLoading } = useInvoices({
    competenceMonth: competenceMonth || undefined,
    periodType: periodType === "ALL" ? undefined : periodType,
  });

  const totals = useMemo(() => {
    const total = invoices?.reduce((sum, invoice) => sum + Number(invoice.amount), 0) ?? 0;
    const paid = invoices?.filter((invoice) => invoice.status === INVOICE_STATUS.PAID).length ?? 0;
    return { total, paid, count: invoices?.length ?? 0 };
  }, [invoices]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <Layout>
      <div className="mb-8 bg-card border border-border/80 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mb-1">Notas Fiscais</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
               <FileText className="w-4 h-4" />
               Gerenciamento de faturamento e obrigações fiscais
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold shadow-md shadow-primary/10 transition-all hover:shadow-primary/20 px-6">
                <Plus className="w-5 h-5 mr-2" />
                Cadastrar NF-e
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-display font-bold">Registro de Faturamento</DialogTitle>
                <DialogDescription>
                  O lançamento gera automaticamente o vínculo com o financeiro real.
                </DialogDescription>
              </DialogHeader>
              <CreateInvoiceForm
                onSuccess={(invoice) => {
                  setCompetenceMonth(invoice.competenceMonth);
                  setPeriodType(invoice.periodType as "A_01_15" | "B_16_END");
                  setOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-border/80 shadow-sm overflow-hidden group border-t-4 border-t-primary">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <FileText className="w-12 h-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-[0.1em]">Volume no Período</CardDescription>
            <CardTitle className="text-3xl font-display font-bold text-primary">{formatCurrency(totals.total)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80 shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-[0.1em]">Notas Liquidadas</CardDescription>
            <CardTitle className="text-3xl font-display font-bold text-green-600">{totals.paid} de {totals.count}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80 shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <Clock className="w-12 h-12 text-blue-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-[0.1em]">Pendentes Envio/Pgto</CardDescription>
            <CardTitle className="text-3xl font-display font-bold text-blue-600">{totals.count - totals.paid}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="bg-card border border-border/80 rounded-xl p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="relative group flex-1 md:flex-none">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
             <Input
                type="month"
                value={competenceMonth}
                onChange={(event) => setCompetenceMonth(event.target.value)}
                className="pl-10 w-full md:w-48 bg-background border-border shadow-sm focus:ring-primary/20 font-medium"
              />
          </div>
          
          <div className="relative group flex-1 md:flex-none">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
             <Select value={periodType} onValueChange={(value) => setPeriodType(value as typeof periodType)}>
                <SelectTrigger className="pl-10 w-full md:w-56 bg-background border-border shadow-sm">
                  <SelectValue placeholder="Todas as quinzenas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todo o Mês</SelectItem>
                  <SelectItem value={INVOICE_PERIODS.A_01_15}>Quinzena A (01 a 15)</SelectItem>
                  <SelectItem value={INVOICE_PERIODS.B_16_END}>Quinzena B (16 ao fim)</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="font-bold text-xs uppercase tracking-wider border-border/80 hover:bg-muted"
          onClick={() => {
            setCompetenceMonth("");
            setPeriodType("ALL");
          }}
        >
          <X className="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wider py-4 pl-6">Número</TableHead>
                <TableHead className="w-[140px] font-semibold text-xs uppercase tracking-wider py-4">Emissão</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Competência</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4 text-center">Período Fiscal</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Situação</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Documento</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider py-4 pr-6">Valor Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground">Localizando registros fiscais...</span>
                     </div>
                  </TableCell>
                </TableRow>
              ) : invoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-24 text-center">
                    <div className="bg-muted/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-10 h-10 text-muted-foreground opacity-40" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Sem notas fiscais</h3>
                    <p className="text-muted-foreground max-w-[300px] mx-auto text-sm">
                      Nenhum documento fiscal localizado para os critérios aplicados.
                    </p>
                    <Button variant="outline" className="mt-8 border-dashed" onClick={() => setOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Cadastrar primeira NF
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                invoices?.map((invoice) => (
                  <TableRow key={invoice.id} className="group hover:bg-muted/40 transition-colors border-b border-border/50">
                    <TableCell className="py-4 pl-6">
                       <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="font-bold text-foreground font-mono">#{invoice.number || "S/N"}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-4 font-medium text-muted-foreground">
                       {format(new Date(invoice.issueDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="py-4 font-bold text-foreground">
                       {invoice.competenceMonth}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                       <Badge variant="outline" className="bg-background font-medium border-border/80 text-muted-foreground text-[10px] tracking-wide px-2">
                         {getInvoicePeriodLabel(invoice.periodType)}
                       </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        className={cn(
                          "font-bold text-[10px] tracking-widest px-2.5 py-0.5 shadow-sm",
                          invoice.status === INVOICE_STATUS.PAID 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : invoice.status === INVOICE_STATUS.SENT
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                        )}
                      >
                        {getInvoiceStatusLabel(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <a
                        href={invoice.attachment.storagePath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 font-bold text-[10px] text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/20 bg-primary/5 uppercase tracking-wider"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Ver Anexo
                      </a>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground py-4 pr-6">
                      {formatCurrency(Number(invoice.amount))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="bg-muted/10 p-4 border-t border-border/80 flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-primary">
                <ShieldCheck className="w-4 h-4" /> Integridade Fiscal Validada
              </span>
           </div>
           <span>Livro de Notas AF Silva</span>
        </div>
      </Card>

      <Card className="mt-8 border-border/80 shadow-sm bg-muted/20 border-l-4 border-l-primary overflow-hidden">
        <CardContent className="py-5 px-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
             <Info className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
             <h4 className="font-bold text-sm text-foreground">Regra de Transação Automática</h4>
             <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Toda nota fiscal salva neste módulo gera automaticamente um lançamento de **Receita** no Livro Caixa. 
                O anexo do arquivo digital é obrigatório para garantir a rastreabilidade em auditorias e fechamentos contábeis.
             </p>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}

// Ensure necessary imports are consistent
import { ShieldCheck, Info } from "lucide-react";
