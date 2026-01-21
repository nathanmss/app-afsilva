import { useDashboardStats, useRanking } from "@/hooks/use-dashboard";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Trophy,
  Truck
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const currentMonth = format(new Date(), "yyyy-MM");
  const { data: stats, isLoading: statsLoading } = useDashboardStats(currentMonth);
  const { data: ranking, isLoading: rankingLoading } = useRanking(currentMonth);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  if (statsLoading || rankingLoading) {
    return (
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview for {format(new Date(), "MMMM yyyy")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Income"
          value={formatCurrency(stats?.income || 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          className="border-green-100 bg-green-50/50"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats?.expenses || 0)}
          icon={<CreditCard className="w-6 h-6" />}
          className="border-red-100 bg-red-50/50"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(stats?.balance || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          subValue={stats?.missingInvoice ? "⚠️ Invoices missing for some transactions" : "All invoices accounted for"}
        />
      </div>

      {stats?.missingInvoice && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">Action Required: Some transactions are missing invoices.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-border/50 shadow-md shadow-black/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Vehicle Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="nickname" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    cursor={{fill: '#F1F5F9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="estimatedRevenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md shadow-black/5">
          <CardHeader>
            <CardTitle>Top Earners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ranking?.slice(0, 5).map((vehicle, idx) => (
                <div key={vehicle.vehicleId} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{vehicle.nickname}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(vehicle.estimatedRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
