import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useCreateInvoice, useExtractInvoiceDraft, useInvoices } from "@/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle, FileText, Link2, Plus, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema, INVOICE_PERIODS, INVOICE_STATUS } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { z } from "zod";

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
        title: "Leitura obrigatoria",
        description: "Envie a nota fiscal e clique em 'Ler Nota Fiscal' antes de salvar.",
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <FormLabel>1. Envie a nota fiscal</FormLabel>
          <Input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setAttachmentId(null);
              setWarnings([]);
            }}
          />
          <p className="text-sm text-muted-foreground">
            O sistema faz a leitura do PDF e preenche os campos automaticamente quando possivel.
          </p>
          <Button type="button" variant="secondary" className="w-full font-semibold" disabled={isPending || !file} onClick={handleExtract}>
            {isExtracting ? "Lendo nota..." : "Ler Nota Fiscal"}
          </Button>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Revise os campos extraidos</span>
            </div>
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>2. Numero da nota</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 000123" {...field} value={field.value ?? ""} />
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
                <FormLabel>Valor da nota (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
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
                <FormLabel>3. Data de emissao</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                    onChange={(event) => field.onChange(new Date(event.target.value))}
                  />
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
                <FormLabel>Mês de competência</FormLabel>
                <FormControl>
                  <Input type="month" {...field} />
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
                <FormLabel>Período</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
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
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={INVOICE_STATUS.ISSUED}>Emitida</SelectItem>
                    <SelectItem value={INVOICE_STATUS.SENT}>Enviada</SelectItem>
                    <SelectItem value={INVOICE_STATUS.PAID}>Paga</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full font-semibold" disabled={isPending}>
          {isPending ? "Salvando..." : "4. Confirmar e Salvar Nota Fiscal"}
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
  return periodType === INVOICE_PERIODS.A_01_15 ? "01 a 15" : "16 ao fim";
}

export default function Invoices() {
  const [open, setOpen] = useState(false);
  const [competenceMonth, setCompetenceMonth] = useState(format(new Date(), "yyyy-MM"));
  const [periodType, setPeriodType] = useState<"ALL" | "A_01_15" | "B_16_END">("ALL");
  const { data: invoices, isLoading } = useInvoices({
    competenceMonth,
    periodType: periodType === "ALL" ? undefined : periodType,
  });

  const totals = useMemo(() => {
    const total = invoices?.reduce((sum, invoice) => sum + Number(invoice.amount), 0) ?? 0;
    const paid = invoices?.filter((invoice) => invoice.status === INVOICE_STATUS.PAID).length ?? 0;
    return { total, paid, count: invoices?.length ?? 0 };
  }, [invoices]);

  return (
    <Layout>
      <div className="flex flex-col gap-4 mb-8 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Notas Fiscais</h1>
          <p className="text-muted-foreground">Controle das NFs com anexo obrigatório e filtro por quinzena.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Nova Nota Fiscal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nota Fiscal</DialogTitle>
              <DialogDescription>
                O sistema registra a NF e cria automaticamente a receita vinculada no financeiro.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Total filtrado</CardDescription>
            <CardTitle className="text-2xl">R$ {totals.total.toFixed(2).replace(".", ",")}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Notas no período</CardDescription>
            <CardTitle className="text-2xl">{totals.count}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Notas pagas</CardDescription>
            <CardTitle className="text-2xl">{totals.paid}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-col gap-3 mb-6 md:flex-row">
        <Input
          type="month"
          value={competenceMonth}
          onChange={(event) => setCompetenceMonth(event.target.value)}
          className="md:w-48 bg-background"
        />
        <Select value={periodType} onValueChange={(value) => setPeriodType(value as typeof periodType)}>
          <SelectTrigger className="md:w-56 bg-background">
            <SelectValue placeholder="Filtrar por período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as quinzenas</SelectItem>
            <SelectItem value={INVOICE_PERIODS.A_01_15}>Quinzena A (01 a 15)</SelectItem>
            <SelectItem value={INVOICE_PERIODS.B_16_END}>Quinzena B (16 ao fim)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>NF</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Competência</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Anexo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Carregando notas fiscais...
                </TableCell>
              </TableRow>
            ) : invoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-foreground">Nenhuma nota fiscal encontrada</h3>
                    <p className="text-muted-foreground mt-1">
                      Ajuste os filtros ou cadastre a primeira NF com anexo.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">#{invoice.number || "Sem número"}</TableCell>
                  <TableCell>{format(new Date(invoice.issueDate), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{invoice.competenceMonth}</TableCell>
                  <TableCell>{getInvoicePeriodLabel(invoice.periodType)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={invoice.status === INVOICE_STATUS.PAID ? "default" : "outline"}
                      className={invoice.status === INVOICE_STATUS.PAID ? "bg-green-600 text-white hover:bg-green-700" : ""}
                    >
                      {getInvoiceStatusLabel(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={invoice.attachment.storagePath}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <Link2 className="w-4 h-4" />
                      Abrir
                    </a>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {Number(invoice.amount).toFixed(2).replace(".", ",")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Card className="mt-6 border-border/50">
        <CardContent className="pt-6 text-sm text-muted-foreground flex items-start gap-3">
          <Upload className="w-4 h-4 mt-0.5 text-primary" />
          <p>
            Toda nota fiscal cadastrada aqui gera automaticamente uma entrada real no financeiro. O anexo é obrigatório
            para manter rastreabilidade no fechamento.
          </p>
        </CardContent>
      </Card>
    </Layout>
  );
}
