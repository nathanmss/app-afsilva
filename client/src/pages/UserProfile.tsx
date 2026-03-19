import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Building2, FileBadge2, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { updateUserProfileSchema, USER_ROLES } from "@shared/schema";

export default function UserProfile() {
  const { profile, isLoading, updateMutation } = useUserProfile();

  const form = useForm<z.infer<typeof updateUserProfileSchema>>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? "",
        email: profile.email ?? "",
      });
    }
  }, [profile, form]);

  if (isLoading) {
    return (
      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[420px] rounded-xl" />
          <Skeleton className="h-[260px] rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 bg-card border border-border/80 p-6 rounded-xl shadow-sm">
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mb-1">Meu Perfil</h1>
        <p className="text-muted-foreground font-medium">Dados do usuário responsável pelo acesso ao sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-lg font-display font-bold flex items-center gap-2">
              <UserRound className="w-5 h-5 text-primary" />
              Informações do Usuário
            </CardTitle>
            <CardDescription>Atualize o nome que será exibido no sistema e o e-mail de contato.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nome exibido no sistema</FormLabel>
                      <FormControl>
                        <Input className="bg-background border-border" placeholder="Ex.: Adonilton" {...field} />
                      </FormControl>
                      <FormDescription>Este nome será mostrado na sidebar e nas áreas autenticadas.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">E-mail</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-background border-border"
                          placeholder="contato@empresa.com.br"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>Opcional. Útil para contato e recuperação futura de acesso.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button type="submit" className="w-full md:w-auto font-bold h-12 px-8" disabled={updateMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? "Salvando..." : "Salvar Perfil"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/80 shadow-sm bg-sidebar text-sidebar-foreground overflow-hidden">
            <div className="p-1 bg-primary" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-display font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                Resumo da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-3">
                <BadgeCheck className="w-4 h-4 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold opacity-90">Perfil</p>
                  <p className="opacity-80">{profile?.role === USER_ROLES.ADMIN ? "ADM" : "OPERADOR"}</p>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-3">
                <FileBadge2 className="w-4 h-4 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold opacity-90">Documento de acesso</p>
                  <p className="opacity-80 break-all">{profile?.cnpj ?? profile?.cpf ?? "Não informado"}</p>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-3">
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold opacity-90">E-mail atual</p>
                  <p className="opacity-80 break-all">{profile?.email ?? "Não informado"}</p>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-3">
                <Building2 className="w-4 h-4 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold opacity-90">Empresa vinculada</p>
                  <p className="opacity-80">Tenant #{profile?.tenantId ?? "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
