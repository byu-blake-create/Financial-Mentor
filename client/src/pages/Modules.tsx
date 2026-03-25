import { useMemo, useState } from "react";
import { useModules, useUpdateModuleProgress } from "@/hooks/use-modules";
import { ModuleCard } from "@/components/ui/ModuleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Module } from "@/hooks/use-modules";

function moduleMatchesSearch(module: Module, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const hay = `${module.title} ${module.description} ${module.category}`.toLowerCase();
  return terms.every((t) => hay.includes(t));
}

export default function Modules() {
  const { data, isLoading } = useModules();
  const updateProgress = useUpdateModuleProgress();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const searchTerms = useMemo(
    () => searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [searchQuery]
  );
  const searching = searchTerms.length > 0;

  const pendingModuleId =
    updateProgress.isPending && updateProgress.variables
      ? updateProgress.variables.moduleId
      : null;

  const runToggle = async (
    module: Module,
    patch: { watched?: boolean; watchLater?: boolean }
  ) => {
    try {
      await updateProgress.mutateAsync({ moduleId: module.id, ...patch });
    } catch (e: unknown) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const cardPropsFor = (module: Module) => ({
    ...module,
    actionsDisabled: pendingModuleId === module.id,
    onToggleWatched: () =>
      runToggle(module, { watched: !module.watched }),
    onToggleWatchLater: () =>
      runToggle(module, { watchLater: !module.watchLater }),
  });

  if (isLoading) {
    return <ModulesSkeleton />;
  }

  if (!data) return null;

  const filterList = (list: Module[]) =>
    searching ? list.filter((m) => moduleMatchesSearch(m, searchTerms)) : list;

  const watchLaterList = filterList(data.watchLater);
  const suggestedList = filterList(data.suggested);
  const popularList = filterList(data.popular);
  const allList = filterList(data.all);
  const watchedList = filterList(data.watched);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Learning Modules</h1>
          <p className="text-muted-foreground mt-1">Boost your financial literacy with these curated lessons</p>
        </div>

        <div className="relative w-full md:w-72">
          <label htmlFor="modules-search" className="sr-only">
            Search modules by topic
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id="modules-search"
            type="search"
            autoComplete="off"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {watchLaterList.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
              Watch later
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {watchLaterList.map((module) => (
              <ModuleCard key={`wl-${module.id}`} {...cardPropsFor(module)} className="w-full" />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-slate-800 rounded-full" />
          Suggested For You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {suggestedList.length > 0 ? (
            suggestedList.map((module) => (
              <ModuleCard key={module.id} {...cardPropsFor(module)} className="w-full" />
            ))
          ) : searching ? (
            <p className="text-muted-foreground col-span-full">No suggested modules match your search.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-orange-500 rounded-full" />
          Popular Now
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {popularList.length > 0 ? (
            popularList.map((module) => (
              <ModuleCard key={module.id} {...cardPropsFor(module)} className="w-full" />
            ))
          ) : searching ? (
            <p className="text-muted-foreground col-span-full">No popular modules match your search.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-slate-600 rounded-full" />
          All Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allList.length > 0 ? (
            allList.map((module) => (
              <ModuleCard key={`all-${module.id}`} {...cardPropsFor(module)} className="w-full" />
            ))
          ) : searching ? (
            <p className="text-muted-foreground col-span-full">No modules match your search.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          Watched
        </h2>
        {watchedList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {watchedList.map((module) => (
              <ModuleCard key={`watched-${module.id}`} {...cardPropsFor(module)} className="w-full" />
            ))}
          </div>
        ) : searching && data.watched.length > 0 ? (
          <p className="text-muted-foreground">No watched modules match your search.</p>
        ) : (
          <p className="text-muted-foreground">Modules you mark as watched will show up here.</p>
        )}
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
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
