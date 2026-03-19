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
    <div className={cn("bg-card border border-border/80 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden", className)}>
      {/* Decorative accent background for top right corner */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full opacity-50 pointer-events-none" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3.5 bg-primary/10 rounded-xl text-primary shadow-inner">
          {icon}
        </div>
        {trend && (
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", trendUp ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200")}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-auto relative z-10">
        <h3 className="text-muted-foreground font-semibold text-sm mb-1.5 uppercase tracking-wide">{title}</h3>
        <div className="text-3xl font-display font-bold text-foreground tracking-tight">{value}</div>
        {subValue && (
          <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/60 font-medium">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}
