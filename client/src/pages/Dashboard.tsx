import { useDashboardData } from "@/hooks/use-dashboard";
import { StatCard } from "@/components/ui/StatCard";
import { ModuleCard } from "@/components/ui/ModuleCard";
import { 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight,
  Wallet,
  ShoppingBag
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  const monthlyTotal = data.budget ? parseFloat(data.budget.totalAmount) : 0;
  const totalAllocated =
    data.budget?.categories.reduce(
      (sum, c) => sum + parseFloat(c.allocatedAmount || "0"),
      0
    ) ?? 0;
  const remaining = Math.max(0, monthlyTotal - totalAllocated);

  const hasMonthlyBudget = Number.isFinite(monthlyTotal) && monthlyTotal > 0;
  const allocatedColor = "hsl(var(--primary))";
  const remainingColor = "hsl(var(--muted))";

  let budgetData: { name: string; value: number; color: string }[] = [];
  if (!data.budget) {
    budgetData = [{ name: "No data", value: 1, color: "hsl(var(--muted))" }];
  } else if (!hasMonthlyBudget) {
    budgetData = [{ name: "Set budget", value: 1, color: "hsl(var(--muted))" }];
  } else {
    if (totalAllocated > 0) {
      budgetData.push({ name: "Used", value: totalAllocated, color: allocatedColor });
    }
    if (remaining > 0) {
      budgetData.push({ name: "Remaining", value: remaining, color: remainingColor });
    }
    if (budgetData.length === 0) {
      budgetData.push({ name: "Remaining", value: monthlyTotal, color: remainingColor });
    }
  }

  const twoPartRing =
    budgetData.length === 2 &&
    budgetData.some((d) => d.name === "Used") &&
    budgetData.some((d) => d.name === "Remaining");

  const pctAllocated =
    hasMonthlyBudget && monthlyTotal > 0
      ? Math.min(100, Math.round((totalAllocated / monthlyTotal) * 100))
      : 0;
  const isOverAllocated = hasMonthlyBudget && totalAllocated > monthlyTotal;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-display">
          Welcome back, {user?.firstName || 'Friend'}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your finances today.
        </p>
      </div>

      {/* Top Section: Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/budget">
          <StatCard 
            title="Monthly budget" 
            value={
              hasMonthlyBudget
                ? `$${monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                : data.budget
                  ? "$0"
                  : "—"
            }
            className="md:col-span-1 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col items-center justify-center py-4">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={twoPartRing ? 2 : 0}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {budgetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        name === "Used" ? "Used" : "Remaining",
                      ]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-3xl font-bold text-foreground font-display tabular-nums">
                    {hasMonthlyBudget ? `${pctAllocated}%` : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    Used
                  </span>
                </div>
              </div>
              <p
                className={`text-center text-sm font-medium mt-2 flex items-center justify-center gap-2 px-1 ${
                  isOverAllocated ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {isOverAllocated && <AlertCircle className="w-4 h-4 shrink-0" />}
                {!data.budget && (
                  <span>No budget yet — open Budget to set your monthly limit.</span>
                )}
                {data.budget && !hasMonthlyBudget && (
                  <span>Set a monthly limit on the Budget page to track allocations.</span>
                )}
                {data.budget && hasMonthlyBudget && isOverAllocated && (
                  <span>
                    Used ${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} exceeds your ${monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} budget.
                  </span>
                )}
                {data.budget && hasMonthlyBudget && !isOverAllocated && (
                  <span>
                    ${totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} used
                    {" · "}
                    ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining
                  </span>
                )}
              </p>
            </div>
          </StatCard>
        </Link>

        {/* AI Insight Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-8 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                AI INSIGHT
              </span>
            </div>
            
            <div className="mt-6">
              <h3 className="text-xl font-bold font-display mb-3">AI Financial Expert's Thoughts</h3>
              <p className="text-slate-300 leading-relaxed mb-6 max-w-lg">
                You have not been contributing to your savings goal this month. 
                Based on your recent transaction history, here is a strategy to cut back on discretionary spending.
              </p>
              
              <Link href="/chat">
                <button className="flex items-center gap-2 text-sm font-semibold bg-white text-slate-900 px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-lg shadow-black/20">
                  View Recommendations
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Modules Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display">Suggested for you</h2>
          <Link href="/modules" className="text-sm font-medium text-primary hover:underline">View All</Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...data.modules.recent, ...data.modules.recommended]
            .slice(0, 4)
            .map((module) => (
              <ModuleCard key={module.id} {...module} />
            ))}
        </div>
      </div>

      {/* Bottom Section: Recent Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display">Recent Transactions</h2>
          <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">View All</Link>
        </div>
        
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {data.recentTransactions.map((tx, index) => (
            <div 
              key={tx.id} 
              className={`flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${
                index !== data.recentTransactions.length - 1 ? 'border-b' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  {tx.description.toLowerCase().includes('shopping') ? (
                    <ShoppingBag className="w-5 h-5" />
                  ) : tx.description.toLowerCase().includes('transfer') ? (
                    <Wallet className="w-5 h-5" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(tx.date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <span className="font-mono font-medium text-foreground">
                -${parseFloat(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
          
          {data.recentTransactions.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No recent transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl md:col-span-2" />
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
