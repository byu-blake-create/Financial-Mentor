import { useModules } from "@/hooks/use-modules";
import { ModuleCard } from "@/components/ui/ModuleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function Modules() {
  const { data, isLoading } = useModules();

  if (isLoading) {
    return <ModulesSkeleton />;
  }

  if (!data) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Learning Modules</h1>
          <p className="text-muted-foreground mt-1">Boost your financial literacy with these curated lessons</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search topics..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full" />
            Keep Learning
          </h2>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {data.keepLearning.map((module) => (
            <div key={module.id} className="snap-start">
              <ModuleCard {...module} className="w-[300px]" />
            </div>
          ))}
          {data.keepLearning.length === 0 && <p className="text-muted-foreground">You haven't started any modules yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-slate-800 rounded-full" />
          Suggested For You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.suggested.map((module) => (
            <ModuleCard key={module.id} {...module} className="w-full" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-orange-500 rounded-full" />
          Popular Now
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.popular.map((module) => (
            <ModuleCard key={module.id} {...module} className="w-full" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-slate-600 rounded-full" />
          All Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.all.map((module) => (
            <ModuleCard key={module.id} {...module} className="w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}

function ModulesSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      {[1, 2, 3].map(section => (
        <div key={section} className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
