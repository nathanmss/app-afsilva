import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useDashboardStats(month?: string) {
  return useQuery({
    queryKey: [api.dashboard.stats.path, { month }],
    queryFn: async () => {
      const url = buildUrl(api.dashboard.stats.path);
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      
      const res = await fetch(`${url}?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.dashboard.stats.responses[200].parse(await res.json());
    },
  });
}

export function useRanking(month?: string) {
  return useQuery({
    queryKey: [api.dashboard.ranking.path, { month }],
    queryFn: async () => {
      const url = buildUrl(api.dashboard.ranking.path);
      const params = new URLSearchParams();
      if (month) params.append("month", month);

      const res = await fetch(`${url}?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch ranking");
      return api.dashboard.ranking.responses[200].parse(await res.json());
    },
  });
}
