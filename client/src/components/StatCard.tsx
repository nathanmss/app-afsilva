import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  subValue?: string;
}

export function StatCard({ title, value, icon, trend, trendUp, className, subValue }: StatCardProps) {
  return (
    <div className={cn("bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300", className)}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          {icon}
        </div>
        {trend && (
          <span className={cn("text-xs font-bold px-2 py-1 rounded-full", trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-muted-foreground font-medium text-sm mb-1">{title}</h3>
      <div className="text-3xl font-display font-bold text-foreground">{value}</div>
      {subValue && <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">{subValue}</div>}
    </div>
  );
}
