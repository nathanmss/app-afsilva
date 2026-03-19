import { useDashboardStats, useRanking } from "@/hooks/use-dashboard";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useState } from "react";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Trophy,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const { data: stats, isLoading: statsLoading } = useDashboardStats(selectedMonth);
  const { data: ranking, isLoading: rankingLoading } = useRanking(selectedMonth);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const displayMonth = format(new Date(`${selectedMonth}-01T00:00:00`), "MMMM yyyy", { locale: ptBR });
  const capitalizedMonth = displayMonth.charAt(0).toUpperCase() + displayMonth.slice(1);

  if (statsLoading || rankingLoading) {
    return (
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-card border border-border/80 p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight mb-2">Painel Operacional</h1>
          <p className="text-muted-foreground font-medium">Visão geral financeira e frota de <span className="text-foreground font-semibold">{capitalizedMonth}</span></p>
        </div>
        <div className="w-full md:w-auto flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Período de Análise</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="w-full md:w-56 bg-background shadow-sm border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Receita Total"
          value={formatCurrency(stats?.income || 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          className="border-t-4 border-t-green-500"
        />
        <StatCard
          title="Despesas Totais"
          value={formatCurrency(stats?.expenses || 0)}
          icon={<CreditCard className="w-6 h-6" />}
          className="border-t-4 border-t-red-500"
        />
        <StatCard
          title="Saldo Líquido"
          value={formatCurrency(stats?.balance || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          className="border-t-4 border-t-primary"
          subValue={stats?.missingInvoice ? "⚠️ Atenção: Notas fiscais pendentes" : "Operações devidamente documentadas"}
        />
        <StatCard
          title="Notas Fiscais"
          value={formatCurrency(stats?.currentInvoiceTotal || 0)}
          icon={<FileText className="w-6 h-6" />}
          className="border-t-4 border-t-blue-500"
          subValue={stats?.missingInvoice ? "Nenhuma NF na competência" : "Volume total de notas emitidas"}
        />
      </div>

      {stats?.missingInvoice && (
        <div className="bg-amber-50/80 border-l-4 border-amber-500 rounded-r-xl p-5 mb-8 flex items-start gap-4 shadow-sm">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-900 font-semibold mb-1">Ação Necessária Identificada</h4>
            <p className="text-amber-800 text-sm font-medium">Existem transações registradas neste período que ainda não possuem nota fiscal anexada. Regularize para garantir a conformidade.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-primary" />
              Desempenho da Frota (Receita Estimada)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="nickname" 
                    stroke="#64748B" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'var(--foreground)' }}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
                    tick={{ fill: 'var(--foreground)' }}
                  />
                  <Tooltip 
                    cursor={{fill: 'var(--muted)'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 500 }}
                    formatter={(value: number) => [formatCurrency(value), "Receita"]}
                  />
                  <Bar dataKey="estimatedRevenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <CardTitle className="text-lg">Veículos em Destaque</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex-1 flex flex-col">
            <div className="space-y-1 mt-4">
              {ranking?.slice(0, 5).map((vehicle, idx) => (
                <div key={vehicle.vehicleId} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/60 transition-colors border border-transparent hover:border-border/50">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm", 
                      idx === 0 ? "bg-yellow-100 text-yellow-700" :
                      idx === 1 ? "bg-slate-200 text-slate-700" :
                      idx === 2 ? "bg-orange-100 text-orange-800" :
                      "bg-primary/10 text-primary"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground leading-none mb-1.5">{vehicle.nickname}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                        {vehicle.plate}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-foreground">{formatCurrency(vehicle.estimatedRevenue)}</p>
                  </div>
                </div>
              ))}
              {(!ranking || ranking.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum dado de veículo disponível para este período.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
