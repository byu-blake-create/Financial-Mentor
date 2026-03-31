import { useDashboardData } from "@/hooks/use-dashboard";
import { StatCard } from "@/components/ui/StatCard";
import { ModuleCard } from "@/components/ui/ModuleCard";
import { 
  TrendingUp, 
  AlertCircle, 
  ArrowRight
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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

  const budgetUsed = 100; // Mocked 100% as per requirements
  // When at 100%, only show the used segment to avoid padding gap
  const budgetData = budgetUsed >= 100 
    ? [{ name: "Used", value: 100, color: "hsl(var(--primary))" }]
    : [
        { name: "Used", value: budgetUsed, color: "hsl(var(--primary))" },
        { name: "Remaining", value: 100 - budgetUsed, color: "hsl(var(--muted))" },
      ];

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
            title="Budget Status" 
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
                      paddingAngle={budgetUsed >= 100 ? 0 : 5}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {budgetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-4xl font-bold text-foreground font-display">{budgetUsed}%</span>
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Used</span>
                </div>
              </div>
              <p className="text-center text-sm font-medium text-destructive mt-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                You've used 100% of this month's budget
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
          <h2 className="text-xl font-bold font-display">Continue Learning</h2>
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
