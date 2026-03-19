import { useCompanyProfile } from "@/hooks/use-company-profile";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTenantProfileSchema } from "@shared/schema";
import { z } from "zod";
import { Building2, Percent, MapPin, Save, ShieldCheck, Info } from "lucide-react";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function normalizePercentString(value: number, digits = 4) {
  return value
    .toFixed(digits)
    .replace(/\.?0+$/, "");
}

function formatStoredPercent(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? normalizePercentString(numeric * 100) : "0";
}

function parsePercentInput(value: string) {
  const normalized = String(value).replace(",", ".");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? normalizePercentString(numeric / 100, 6) : value;
}

export default function CompanyProfile() {
  const { profile, isLoading, updateMutation } = useCompanyProfile();

  const form = useForm<z.infer<typeof updateTenantProfileSchema>>({
    resolver: zodResolver(updateTenantProfileSchema),
    defaultValues: {
      name: "",
      city: "",
      state: "",
      urbanPercent: "0",
      tripPercent: "0",
    },
  });

  // Load profile data into form when available
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        city: profile.city ?? "",
        state: profile.state ?? "",
        urbanPercent: formatStoredPercent(profile.urbanPercent),
        tripPercent: formatStoredPercent(profile.tripPercent),
      });
    }
  }, [profile, form]);

  if (isLoading) {
    return (
      <Layout>
        <div className="mb-8 h-24 bg-card border border-border/50 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Skeleton className="h-[400px] rounded-xl" />
           <Skeleton className="h-[200px] rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 bg-card border border-border/80 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mb-1">Perfil da Empresa</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
               <Building2 className="w-4 h-4" />
               Configurações institucionais e parâmetros operacionais
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-lg font-display font-bold flex items-center gap-2">
               <Building2 className="w-5 h-5 text-primary" />
               Dados Institucionais
            </CardTitle>
            <CardDescription>Informações básicas da transportadora</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateMutation.mutate({ ...data, urbanPercent: parsePercentInput(data.urbanPercent), tripPercent: parsePercentInput(data.tripPercent) }))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nome da Empresa / Razão Social</FormLabel>
                      <FormControl>
                        <Input className="bg-background border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                           <MapPin className="w-3 h-3" /> Cidade Base
                        </FormLabel>
                        <FormControl>
                          <Input className="bg-background border-border" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Estado (UF)</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-border font-mono uppercase" maxLength={2} {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-6 border-t border-border/50">
                   <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-primary" />
                      Parâmetros de Receita
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="urbanPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Margem Urbana (%)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="number" step="0.01" className="bg-background border-border pr-10 font-mono font-bold" {...field} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">%</span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px] leading-relaxed">Informe em porcentagem. Ex.: 10.9 para 10,9% sobre o frete bruto em operações dentro da cidade.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tripPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Margem Viagem (%)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type="number" step="0.01" className="bg-background border-border pr-10 font-mono font-bold" {...field} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">%</span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-[10px] leading-relaxed">Informe em porcentagem. Ex.: 8.5 para 8,5% sobre o frete bruto em viagens rodoviárias.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                </div>

                <div className="pt-6">
                   <Button 
                    type="submit" 
                    className="w-full md:w-auto font-bold h-12 px-8 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" 
                    disabled={updateMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? "Salvando Alterações..." : "Salvar Configurações"}
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
                 Segurança Administrativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-3">
                <Info className="w-4 h-4 shrink-0 text-primary" />
                <p className="font-medium opacity-90 leading-relaxed">Estas configurações afetam diretamente o cálculo de receita estimada em todos os romaneios futuros.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
                <p className="font-medium opacity-90 leading-relaxed">Apenas usuários com perfil de Administrador podem visualizar ou alterar estes dados base.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm overflow-hidden bg-muted/20">
             <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nota Técnica</CardTitle>
             </CardHeader>
             <CardContent className="pt-4 text-[11px] text-muted-foreground leading-relaxed italic">
                Os valores informados nesta tela são percentuais visuais. O sistema converte automaticamente para o formato interno usado no cálculo dos romaneios. Mudanças não retroagem para romaneios já cadastrados.
             </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
