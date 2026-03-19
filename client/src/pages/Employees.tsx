import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useEmployees, useCreateEmployee, useDeleteEmployee, useEmployeePayments, usePayEmployee } from "@/hooks/use-employees";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Users, Plus, ShieldCheck, KeyRound, CalendarDays, Wallet, Briefcase, IdCard, Banknote, UserCheck, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EMPLOYEE_STATUS, insertEmployeePaymentSchema, insertEmployeeSchema } from "@shared/schema";
import { formatCpf } from "@shared/cpf";
import { format } from "date-fns";
import { z } from "zod";
import { cn } from "@/lib/utils";

function CreateEmployeeForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateEmployee();

  const form = useForm<z.infer<typeof insertEmployeeSchema>>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      name: "",
      cpf: "",
      position: "Operador",
      salary: "0",
      payday: 5,
      status: EMPLOYEE_STATUS.ACTIVE,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data, { onSuccess }))} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" className="bg-background border-border" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">CPF (Somente Números)</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" className="bg-background border-border font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Cargo / Função</FormLabel>
                <FormControl>
                  <Input placeholder="Operador" className="bg-background border-border" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Salário (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" className="bg-background border-border font-mono" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="payday"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Dia do Mês</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    className="bg-background border-border"
                    value={field.value}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status Inicial</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={EMPLOYEE_STATUS.ACTIVE}>Ativo</SelectItem>
                    <SelectItem value={EMPLOYEE_STATUS.INACTIVE}>Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-800 space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wide">
            <KeyRound className="w-3.5 h-3.5" />
            Credenciais de Acesso
          </div>
          <p className="font-medium opacity-80">O acesso do operador será criado automaticamente: o login é o CPF e a senha inicial são os 4 últimos dígitos do CPF.</p>
        </div>

        <Button type="submit" className="w-full font-bold h-12 shadow-lg shadow-primary/20" disabled={isPending}>
          {isPending ? "Processando Cadastro..." : "Salvar Funcionário"}
        </Button>
      </form>
    </Form>
  );
}

function PayEmployeeForm({
  employee,
  competenceMonth,
  onSuccess,
}: {
  employee: {
    id: number;
    name: string;
    salary: string;
  };
  competenceMonth: string;
  onSuccess: () => void;
}) {
  const { mutate, isPending } = usePayEmployee();

  const form = useForm<z.infer<typeof insertEmployeePaymentSchema>>({
    resolver: zodResolver(insertEmployeePaymentSchema),
    defaultValues: {
      employeeId: employee.id,
      competenceMonth,
      paymentDate: new Date(),
      amount: employee.salary,
      status: "PAID",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          mutate(data, {
            onSuccess: () => {
              form.reset({
                employeeId: employee.id,
                competenceMonth,
                paymentDate: new Date(),
                amount: employee.salary,
                status: "PAID",
              });
              onSuccess();
            },
          })
        )}
        className="space-y-5"
      >
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Pagamento para</p>
          <p className="font-bold text-foreground text-lg">{employee.name}</p>
          <Badge variant="outline" className="mt-2 bg-background font-bold text-[10px] tracking-widest border-border/80 text-muted-foreground uppercase">
            Competência {competenceMonth}
          </Badge>
        </div>

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Data da Quitação</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  className="bg-background border-border"
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Valor Total Pago (R$)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
                  <Input type="number" step="0.01" className="pl-10 bg-background border-border font-mono text-lg font-bold" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full font-bold h-12 shadow-lg shadow-primary/20" disabled={isPending}>
          {isPending ? "Registrando Folha..." : "Confirmar Pagamento"}
        </Button>
      </form>
    </Form>
  );
}

export default function Employees() {
  const [open, setOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [competenceMonth, setCompetenceMonth] = useState(format(new Date(), "yyyy-MM"));
  const { data: employees, isLoading } = useEmployees();
  const deleteEmployeeMutation = useDeleteEmployee();
  const { data: payments, isLoading: isLoadingPayments } = useEmployeePayments(competenceMonth);

  const selectedEmployee = employees?.find((employee) => employee.id === selectedEmployeeId) ?? null;
  const paidEmployees = useMemo(
    () => new Set((payments ?? []).map((payment) => payment.employeeId)),
    [payments],
  );

  const totalPayroll = useMemo(
    () => (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0),
    [payments],
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleDeleteEmployee = (employeeId: number, employeeName: string) => {
    const confirmed = window.confirm(
      `Excluir ${employeeName}? Essa ação remove o cadastro e o acesso do operador, desde que ele ainda não tenha histórico de pagamentos.`,
    );

    if (!confirmed) {
      return;
    }

    deleteEmployeeMutation.mutate(employeeId);
  };

  return (
    <Layout>
      <div className="mb-8 bg-card border border-border/80 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mb-1">Recursos Humanos</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Controle de equipe e folha de pagamento AF Silva
            </p>
          </div>

          <div className="w-full xl:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative group">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="month"
                value={competenceMonth}
                onChange={(event) => setCompetenceMonth(event.target.value)}
                className="pl-10 sm:w-44 bg-background border-border shadow-sm focus:ring-primary/20 font-medium"
              />
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold shadow-md shadow-primary/10 transition-all hover:shadow-primary/20 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-display font-bold">Cadastrar Operador</DialogTitle>
                  <DialogDescription>
                    O cadastro cria automaticamente o acesso do operador ao sistema.
                  </DialogDescription>
                </DialogHeader>
                <CreateEmployeeForm onSuccess={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-display font-bold text-foreground">Registro de Folha</DialogTitle>
            <DialogDescription>
              Lance o pagamento mensal para gerar o registro financeiro automático.
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee ? (
            <PayEmployeeForm
              employee={selectedEmployee}
              competenceMonth={competenceMonth}
              onSuccess={() => {
                setPaymentOpen(false);
                setSelectedEmployeeId(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-border/80 shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <UserCheck className="w-12 h-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-[0.1em]">Equipe Ativa</CardDescription>
            <CardTitle className="text-3xl font-display font-bold">{employees?.filter((employee) => employee.status === EMPLOYEE_STATUS.ACTIVE).length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80 shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="w-12 h-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-[0.1em]">Pagos ({competenceMonth})</CardDescription>
            <CardTitle className="text-3xl font-display font-bold">{payments?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80 shadow-sm overflow-hidden group border-t-4 border-t-primary">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Banknote className="w-12 h-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-[0.1em]">Total Folha Mês</CardDescription>
            <CardTitle className="text-3xl font-display font-bold text-primary">{formatCurrency(totalPayroll)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            [1, 2, 3, 4].map((index) => (
              <div key={index} className="h-64 bg-card border border-border/50 rounded-xl animate-pulse" />
            ))
          ) : employees?.map((employee) => {
            const alreadyPaid = paidEmployees.has(employee.id);

            return (
              <Card key={employee.id} className="group hover:shadow-xl transition-all duration-300 border-border/80 overflow-hidden relative">
                <div
                  className={cn(
                    "absolute top-0 left-0 w-1 h-full transition-all group-hover:w-2",
                    employee.status === EMPLOYEE_STATUS.ACTIVE ? "bg-primary" : "bg-slate-300",
                  )}
                />

                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-border/50 bg-muted/5">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border-2 border-background shadow-md">
                      <AvatarFallback className="text-lg bg-primary text-primary-foreground font-bold">
                        {employee.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0">
                      <CardTitle className="text-lg font-display font-bold text-foreground truncate">{employee.name}</CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold uppercase tracking-wider">{employee.position || "Operador"}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={employee.status === EMPLOYEE_STATUS.ACTIVE ? "default" : "secondary"} className="text-[10px] font-bold tracking-widest px-2 py-0.5">
                    {employee.status === EMPLOYEE_STATUS.ACTIVE ? "ATIVO" : "INATIVO"}
                  </Badge>
                </CardHeader>

                <CardContent className="pt-6 space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IdCard className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Documento</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                      {employee.cpf ? formatCpf(employee.cpf) : "N/D"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Banknote className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Salário</span>
                    </div>
                    <span className="font-bold text-foreground">{formatCurrency(Number(employee.salary))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Vencimento</span>
                    </div>
                    <span className="font-bold text-foreground">Dia {employee.payday}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Button
                      className={cn(
                        "w-full font-bold shadow-sm transition-all h-10",
                        alreadyPaid ? "bg-muted text-muted-foreground" : "shadow-primary/10 hover:shadow-primary/20",
                      )}
                      variant={alreadyPaid ? "secondary" : "default"}
                      disabled={alreadyPaid || employee.status !== EMPLOYEE_STATUS.ACTIVE}
                      onClick={() => {
                        setSelectedEmployeeId(employee.id);
                        setPaymentOpen(true);
                      }}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      {alreadyPaid ? "Pagamento Realizado" : `Quitar ${competenceMonth}`}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10 font-bold border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      disabled={deleteEmployeeMutation.isPending}
                      onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {employees?.length === 0 && !isLoading && (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-border/80 rounded-xl bg-muted/10">
              <div className="bg-muted/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-muted-foreground opacity-40" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Sem Colaboradores</h3>
              <p className="text-muted-foreground max-w-[300px] mx-auto text-sm">
                Nenhum funcionário operacional cadastrado na base de RH AF Silva.
              </p>
              <Button variant="outline" className="mt-8 border-dashed" onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Funcionário
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border/80 shadow-sm bg-sidebar text-sidebar-foreground overflow-hidden">
            <div className="p-1 bg-primary" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                Acesso Operacional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-3">
                <KeyRound className="w-4 h-4 shrink-0 text-primary" />
                <p className="font-medium opacity-90">Login automático via CPF. Senha inicial são os 4 últimos dígitos do documento.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-3">
                <IdCard className="w-4 h-4 shrink-0 text-primary" />
                <p className="font-medium opacity-90">O operador tem acesso restrito ao próprio perfil e ao módulo de cargas e romaneios.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-3">
                <UserCheck className="w-4 h-4 shrink-0 text-primary" />
                <p className="font-medium opacity-90">Dados financeiros e de gestão continuam ocultados para perfis de operador.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Ajuda de Folha</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-muted-foreground leading-relaxed">
              Ao registrar um pagamento aqui, o sistema gera automaticamente uma saída no Livro Caixa (Financeiro) para a categoria de Folha de Pagamento.
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <div className="bg-muted/30 border-b border-border/80 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-[0.1em]">Histórico de Pagamentos ({competenceMonth})</h3>
          <Badge className="font-bold bg-primary shadow-sm">{payments?.length ?? 0} registros</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4 pl-6">Colaborador</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Mês Referência</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4">Data Pagamento</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider py-4 text-center">Situação</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider py-4 pr-6">Valor Quitado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPayments ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="text-sm font-medium text-muted-foreground">Processando dados...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center text-muted-foreground font-medium italic">
                    Nenhum registro de folha para este período.
                  </TableCell>
                </TableRow>
              ) : (
                (payments ?? []).map((payment) => {
                  const employee = employees?.find((item) => item.id === payment.employeeId);
                  return (
                    <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
                      <TableCell className="font-bold text-foreground py-4 pl-6">{employee?.name || `#${payment.employeeId}`}</TableCell>
                      <TableCell className="font-medium text-muted-foreground py-4">{payment.competenceMonth}</TableCell>
                      <TableCell className="font-medium text-muted-foreground py-4">{format(new Date(payment.paymentDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-center py-4">
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-bold text-[10px] tracking-widest">
                          EFETUADO
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground py-4 pr-6">
                        {formatCurrency(Number(payment.amount))}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="bg-muted/10 p-4 border-t border-border/80 flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          <span>Sistema Administrativo AF Silva</span>
          <span>Página 1 de 1</span>
        </div>
      </Card>
    </Layout>
  );
}
