import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useEmployees, useCreateEmployee, useEmployeePayments, usePayEmployee } from "@/hooks/use-employees";
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
import { Users, Plus, ShieldCheck, KeyRound, CalendarDays, Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EMPLOYEE_STATUS, insertEmployeePaymentSchema, insertEmployeeSchema } from "@shared/schema";
import { formatCpf } from "@shared/cpf";
import { format } from "date-fns";
import { z } from "zod";

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
      <form onSubmit={form.handleSubmit((data) => mutate(data, { onSuccess }))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
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
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
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
                <FormLabel>Função</FormLabel>
                <FormControl>
                  <Input placeholder="Operador" {...field} value={field.value ?? ""} />
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
                <FormLabel>Salário base (R$)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
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
                <FormLabel>Dia do pagamento</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={31}
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
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
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

        <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Credenciais iniciais do operador</p>
          <p>Login: CPF informado no cadastro.</p>
          <p>Senha inicial: 4 últimos dígitos do CPF.</p>
        </div>

        <Button type="submit" className="w-full font-semibold" disabled={isPending}>
          {isPending ? "Cadastrando..." : "Cadastrar Funcionário"}
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
          }),
        )}
        className="space-y-4"
      >
        <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm">
          <p className="font-medium text-foreground">{employee.name}</p>
          <p className="text-muted-foreground">Competência {competenceMonth}</p>
        </div>

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do pagamento</FormLabel>
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor pago (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full font-semibold" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar Pagamento"}
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

  return (
    <Layout>
      <div className="flex flex-col gap-4 mb-8 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Funcionários</h1>
          <p className="text-muted-foreground">
            Operadores com acesso por CPF e controle mensal de folha.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="month"
            value={competenceMonth}
            onChange={(event) => setCompetenceMonth(event.target.value)}
            className="sm:w-44 bg-background"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Funcionário Operador</DialogTitle>
                <DialogDescription>
                  O cadastro já cria o acesso do operador ao romaneio usando CPF e senha inicial simplificada.
                </DialogDescription>
              </DialogHeader>
              <CreateEmployeeForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              O sistema registra a folha e lança automaticamente a despesa no financeiro.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Funcionários cadastrados</CardDescription>
            <CardTitle className="text-2xl">{employees?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Pagos em {competenceMonth}</CardDescription>
            <CardTitle className="text-2xl">{payments?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Folha registrada</CardDescription>
            <CardTitle className="text-2xl">R$ {totalPayroll.toFixed(2).replace(".", ",")}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <p className="text-muted-foreground">Carregando equipe...</p>
          ) : employees?.map((employee) => {
            const alreadyPaid = paidEmployees.has(employee.id);

            return (
              <Card key={employee.id} className="border-border/50 hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 shadow-sm">
                      <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                        {employee.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <CardDescription>{employee.position || "Operador"}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={employee.status === EMPLOYEE_STATUS.ACTIVE ? "default" : "secondary"}>
                    {employee.status === EMPLOYEE_STATUS.ACTIVE ? "ATIVO" : "INATIVO"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">CPF de acesso</span>
                    <span className="font-medium text-foreground">
                      {employee.cpf ? formatCpf(employee.cpf) : "Não informado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Salário base</span>
                    <span className="font-medium text-foreground">
                      R$ {Number(employee.salary).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Pagamento</span>
                    <span className="font-medium text-foreground">Dia {employee.payday}</span>
                  </div>

                  <Button
                    className="w-full font-semibold"
                    variant={alreadyPaid ? "secondary" : "default"}
                    disabled={alreadyPaid || employee.status !== EMPLOYEE_STATUS.ACTIVE}
                    onClick={() => {
                      setSelectedEmployeeId(employee.id);
                      setPaymentOpen(true);
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {alreadyPaid ? "Pagamento já registrado" : `Pagar ${competenceMonth}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {employees?.length === 0 && !isLoading && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-foreground">Nenhum funcionário encontrado</h3>
              <p className="text-muted-foreground mt-1">
                Cadastre o primeiro operador para liberar o acesso ao romaneio.
              </p>
            </div>
          )}
        </div>

        <Card className="border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Acesso do Operador</CardTitle>
            <CardDescription>Regra operacional aplicada no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-primary" />
              <p>O operador só acessa o módulo de romaneio e não visualiza valores financeiros.</p>
            </div>
            <div className="flex gap-3">
              <KeyRound className="w-4 h-4 mt-0.5 text-primary" />
              <p>Login pelo CPF do cadastro. Senha inicial igual aos 4 últimos dígitos do CPF.</p>
            </div>
            <div className="flex gap-3">
              <CalendarDays className="w-4 h-4 mt-0.5 text-primary" />
              <p>O cadastro continua servindo à folha, com salário base e dia de pagamento.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Competência</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingPayments ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Carregando pagamentos...
                </TableCell>
              </TableRow>
            ) : payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhum pagamento registrado para {competenceMonth}.
                </TableCell>
              </TableRow>
            ) : (
              payments?.map((payment) => {
                const employee = employees?.find((item) => item.id === payment.employeeId);
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{employee?.name || `#${payment.employeeId}`}</TableCell>
                    <TableCell>{payment.competenceMonth}</TableCell>
                    <TableCell>{format(new Date(payment.paymentDate), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <Badge>{payment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {Number(payment.amount).toFixed(2).replace(".", ",")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
