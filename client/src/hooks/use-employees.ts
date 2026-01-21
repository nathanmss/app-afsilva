import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { insertEmployeeSchema, insertEmployeePaymentSchema } from "@shared/schema";
import { z } from "zod";

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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertEmployeeSchema>) => {
      const res = await fetch(api.employees.create.path, {
        method: api.employees.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create employee");
      return api.employees.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.employees.list.path] }),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertEmployeePaymentSchema>) => {
      const res = await fetch(api.employees.pay.path, {
        method: api.employees.pay.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to record payment");
      return api.employees.pay.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.employees.getPayments.path] });
      queryClient.invalidateQueries({ queryKey: [api.finance.list.path] });
    },
  });
}
