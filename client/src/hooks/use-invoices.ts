import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { insertInvoiceSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function useInvoices(filters?: { competenceMonth?: string; periodType?: "A_01_15" | "B_16_END" }) {
  return useQuery({
    queryKey: [api.invoices.list.path, filters],
    queryFn: async () => {
      const url = buildUrl(api.invoices.list.path);
      const params = new URLSearchParams();
      if (filters?.competenceMonth) params.append("competenceMonth", filters.competenceMonth);
      if (filters?.periodType) params.append("periodType", filters.periodType);

      const res = await fetch(`${url}?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return api.invoices.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof insertInvoiceSchema>) => {
      const res = await fetch(api.invoices.create.path, {
        method: api.invoices.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to create invoice");
      }
      return api.invoices.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
      queryClient.invalidateQueries({ queryKey: [api.finance.list.path] });
      toast({
        title: "Nota fiscal cadastrada",
        description: "A nota fiscal e a receita vinculada foram registradas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar nota fiscal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUploadAttachment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.uploads.upload.path, {
        method: api.uploads.upload.method,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to upload attachment");
      }

      return api.uploads.upload.responses[201].parse(await res.json());
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
