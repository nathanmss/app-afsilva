import { useQuery, useMutation } from "@tanstack/react-query";
import { updateTenantProfileSchema } from "@shared/schema";
import { api } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useCompanyProfile() {
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: [api.companyProfile.get.path],
    queryFn: async () => {
      const res = await fetch(api.companyProfile.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar o perfil da empresa");
      return api.companyProfile.get.responses[200].parse(await res.json());
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateTenantProfileSchema>) => {
      const res = await apiRequest("PUT", api.companyProfile.update.path, data);
      return api.companyProfile.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.companyProfile.get.path] });
      toast({
        title: "Perfil atualizado",
        description: "Os dados da empresa foram salvos com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    profile,
    isLoading,
    updateMutation,
  };
}
