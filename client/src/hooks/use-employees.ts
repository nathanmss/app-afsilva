import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { insertEmployeeSchema, insertEmployeePaymentSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function useEmployees() {
  return useQuery({
    queryKey: [api.employees.list.path],
    queryFn: async () => {
      const res = await fetch(api.employees.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch employees");
      return api.employees.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertEmployeeSchema>) => {
      const res = await fetch(api.employees.create.path, {
        method: api.employees.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to create employee");
      }
      return api.employees.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.employees.list.path] });
      toast({
        title: "Funcionário cadastrado",
        description: "Login pelo CPF e senha inicial com os 4 últimos dígitos do CPF.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: number) => {
      const res = await fetch(api.employees.remove.path.replace(":id", String(employeeId)), {
        method: api.employees.remove.method,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to delete employee");
      }
      return api.employees.remove.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.employees.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.employees.getPayments.path] });
      toast({
        title: "Funcionário excluído",
        description: "O cadastro e o acesso do operador foram removidos.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEmployeePayments(competenceMonth: string) {
  return useQuery({
    queryKey: [api.employees.getPayments.path, competenceMonth],
    queryFn: async () => {
      const params = new URLSearchParams({ competenceMonth });
      const res = await fetch(`${api.employees.getPayments.path}?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return api.employees.getPayments.responses[200].parse(await res.json());
    },
  });
}

export function usePayEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertEmployeePaymentSchema>) => {
      const res = await fetch(api.employees.pay.path, {
        method: api.employees.pay.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to record payment");
      }
      return api.employees.pay.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.employees.getPayments.path] });
      queryClient.invalidateQueries({ queryKey: [api.finance.list.path] });
      toast({
        title: "Pagamento registrado",
        description: "A folha do funcionário foi lançada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
