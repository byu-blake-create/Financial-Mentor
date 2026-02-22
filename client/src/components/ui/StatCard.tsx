import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value?: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  children?: ReactNode;
}

export function StatCard({ title, value, icon, trend, className, children }: StatCardProps) {
  return (
    <div className={cn("bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground font-display uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-muted-foreground bg-muted p-2 rounded-lg">{icon}</div>}
      </div>
      
      {value && (
        <div className="text-3xl font-bold text-foreground font-display mb-1">
          {value}
        </div>
      )}
      
      {trend && (
        <div className={cn("text-sm font-medium flex items-center gap-1", trend.isPositive ? "text-emerald-600" : "text-red-500")}>
          <span>{trend.isPositive ? "↑" : "↓"}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-muted-foreground font-normal ml-1">from last month</span>
        </div>
      )}

      {children}
    </div>
  );
}
