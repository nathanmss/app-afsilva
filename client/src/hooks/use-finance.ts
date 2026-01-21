import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { insertFinanceTransactionSchema } from "@shared/schema";
import { z } from "zod";

export function useFinanceTransactions(filters?: { month?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: [api.finance.list.path, filters],
    queryFn: async () => {
      const url = buildUrl(api.finance.list.path);
      const params = new URLSearchParams();
      if (filters?.month) params.append("month", filters.month);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);

      const res = await fetch(`${url}?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.finance.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertFinanceTransactionSchema>) => {
      const res = await fetch(api.finance.create.path, {
        method: api.finance.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      return api.finance.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.finance.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
