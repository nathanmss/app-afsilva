import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { insertLoadingSchema } from "@shared/schema";
import { z } from "zod";

export function useLoadings(filters?: { month?: string; vehicleId?: number }) {
  return useQuery({
    queryKey: [api.loadings.list.path, filters],
    queryFn: async () => {
      const url = buildUrl(api.loadings.list.path);
      const params = new URLSearchParams();
      if (filters?.month) params.append("month", filters.month);
      if (filters?.vehicleId) params.append("vehicleId", String(filters.vehicleId));

      const res = await fetch(`${url}?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch loadings");
      return api.loadings.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateLoading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertLoadingSchema>) => {
      const res = await fetch(api.loadings.create.path, {
        method: api.loadings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create loading");
      return api.loadings.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.loadings.list.path] }),
  });
}
