import { ModuleCard } from "@/components/ui/ModuleCard";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardData } from "@/hooks/use-dashboard";
import { useFinancialGoals } from "@/hooks/use-financial-goals";
import { formatGoalAmount } from "@/lib/financial-goals-data";
import { AlertCircle, ArrowRight, Target, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();
  const { goals, hydrated: goalsHydrated } = useFinancialGoals(user?.id);

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
          Welcome back, {user?.firstName || "Friend"}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your finances and learning today.
        </p>
      </div>

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
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
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
              <h3 className="text-xl font-bold font-display mb-3">AI Financial Expert&apos;s Thoughts</h3>
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

      <div className="space-y-8">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Up Next</h2>
            <Link href="/modules" className="text-sm font-medium text-primary hover:underline">
              View All
            </Link>
          </div>

          {data.modules.upNext.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {data.modules.upNext.map((module) => (
                <ModuleCard key={module.id} {...module} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border shadow-sm p-6 text-sm text-muted-foreground">
              You&apos;ve finished every module currently available.
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display">Watchlist</h2>
            <Link href="/modules" className="text-sm font-medium text-primary hover:underline">
              Browse Modules
            </Link>
          </div>

          {data.modules.watchlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {data.modules.watchlist.map((module) => (
                <ModuleCard key={module.id} {...module} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border shadow-sm p-6 text-sm text-muted-foreground">
              Save modules for later from any module detail page to build your watchlist.
            </div>
          )}
        </section>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Goals preview
          </h2>
          <Link href="/goals" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {!goalsHydrated ? (
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-44" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          ) : goals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-3">
              <p className="font-medium text-foreground">No goals yet.</p>
              <p className="text-sm">
                Add a goal to keep your priorities front and center.
              </p>
              <Link href="/goals" className="inline-flex text-sm font-medium text-primary hover:underline">
                Create your first goal
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {goals.slice(0, 3).map((g) => {
                const pct =
                  g.targetAmount > 0
                    ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
                    : 0;

                return (
                  <div key={g.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{g.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                          {formatGoalAmount(g.savedAmount, g.unit)} / {formatGoalAmount(g.targetAmount, g.unit)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>
                );
              })}

              {goals.length > 3 && (
                <div className="p-4 text-sm text-muted-foreground">
                  +{goals.length - 3} more goal{goals.length - 3 === 1 ? "" : "s"}
                </div>
              )}
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
