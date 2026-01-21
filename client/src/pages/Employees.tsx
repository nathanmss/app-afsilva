import { Layout } from "@/components/Layout";
import { useEmployees } from "@/hooks/use-employees";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export default function Employees() {
  const { data: employees, isLoading } = useEmployees();

  return (
    <Layout>
      <h1 className="text-3xl font-display font-bold mb-8">Employees</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? <p>Loading...</p> : employees?.map(emp => (
           <Card key={emp.id} className="p-6 flex flex-col items-center text-center gap-4 hover:shadow-lg transition-all">
              <Avatar className="w-20 h-20">
                 <AvatarFallback className="text-xl bg-primary/10 text-primary">{emp.name.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                 <h3 className="font-bold text-lg">{emp.name}</h3>
                 <p className="text-sm text-muted-foreground">{emp.position}</p>
              </div>
              <div className="w-full pt-4 border-t border-border/50 flex justify-between text-sm">
                 <span className="text-muted-foreground">Salary</span>
                 <span className="font-bold">${Number(emp.salary).toFixed(2)}</span>
              </div>
           </Card>
        ))}
      </div>
    </Layout>
  );
}
