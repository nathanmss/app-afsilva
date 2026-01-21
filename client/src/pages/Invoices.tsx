import { Layout } from "@/components/Layout";
import { useInvoices } from "@/hooks/use-invoices";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();

  return (
    <Layout>
      <h1 className="text-3xl font-display font-bold mb-8">Invoices</h1>
      
      <div className="grid gap-4">
        {isLoading ? (
            <p>Loading...</p>
        ) : invoices?.map(inv => (
            <Card key={inv.id} className="flex flex-row items-center justify-between p-4">
               <div>
                  <h3 className="font-bold">Invoice #{inv.number || "Pending"}</h3>
                  <p className="text-sm text-muted-foreground">Issued: {format(new Date(inv.issueDate), "MMM dd, yyyy")}</p>
               </div>
               <div className="text-right">
                  <p className="font-bold text-lg">${Number(inv.amount).toFixed(2)}</p>
                  <Badge variant={inv.status === "PAID" ? "default" : "outline"}>{inv.status}</Badge>
               </div>
            </Card>
        ))}
      </div>
    </Layout>
  );
}
