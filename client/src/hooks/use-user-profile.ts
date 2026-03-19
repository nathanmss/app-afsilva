import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { updateUserProfileSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useUserProfile() {
  const { toast } = useToast();

  const profileQuery = useQuery({
    queryKey: [api.userProfile.get.path],
    queryFn: async () => {
      const res = await fetch(api.userProfile.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar o perfil do usuário");
      return api.userProfile.get.responses[200].parse(await res.json());
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateUserProfileSchema>) => {
      const res = await apiRequest("PUT", api.userProfile.update.path, data);
      return api.userProfile.update.responses[200].parse(await res.json());
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      queryClient.setQueryData([api.userProfile.get.path], user);
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram salvos com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateMutation,
  };
}
