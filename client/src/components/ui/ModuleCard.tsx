import { cn } from "@/lib/utils";
import { Bookmark, Check, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface ModuleCardProps {
  id: number;
  title: string;
  category: string;
  duration?: string;
  imageUrl?: string | null;
  watched?: boolean;
  watchLater?: boolean;
  className?: string;
  onToggleWatched?: () => void;
  onToggleWatchLater?: () => void;
  actionsDisabled?: boolean;
}

export function ModuleCard({
  id,
  title,
  category,
  duration = "5 min",
  imageUrl,
  watched = false,
  watchLater = false,
  className,
  onToggleWatched,
  onToggleWatchLater,
  actionsDisabled,
}: ModuleCardProps) {
  const actionIdle =
    "h-8 w-8 rounded-full bg-background/95 shadow-md backdrop-blur-sm border-2 border-slate-500/55 ring-1 ring-slate-400/40 text-slate-800";
  const actionSelected =
    "h-8 w-8 rounded-full bg-white shadow-md backdrop-blur-sm border-2 border-emerald-500/55 ring-1 ring-emerald-400/30 text-emerald-600";

  return (
    <div className={cn("group relative min-w-[280px]", className)}>
      <div className="absolute top-2 right-2 z-20 flex gap-1">
        {onToggleWatchLater && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={cn(watchLater ? actionSelected : actionIdle)}
            disabled={actionsDisabled}
            aria-label={watchLater ? "Remove from watch later" : "Save to watch later"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWatchLater();
            }}
          >
            <Bookmark
              strokeWidth={watchLater ? 2 : 2.5}
              className={cn(
                "h-4 w-4",
                watchLater
                  ? "fill-emerald-500 stroke-emerald-600 text-emerald-600"
                  : "fill-none stroke-slate-800 text-slate-800"
              )}
            />
          </Button>
        )}
        {onToggleWatched && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={cn(watched ? actionSelected : actionIdle)}
            disabled={actionsDisabled}
            aria-label={watched ? "Mark as not watched" : "Mark as watched"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWatched();
            }}
          >
            <Check
              strokeWidth={watched ? 3.25 : 2.5}
              className={cn(
                "h-4 w-4",
                watched ? "stroke-emerald-600 text-emerald-600" : "stroke-slate-800 text-slate-800"
              )}
            />
          </Button>
        )}
      </div>

      <Link href={`/modules/${id}`}>
        <div className="cursor-pointer">
          <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-muted shadow-sm">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <PlayCircle className="w-12 h-12 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            {watched && (
              <div className="absolute top-2 left-2 rounded-md bg-emerald-600 text-white text-xs font-semibold px-2 py-1 shadow">
                Watched
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
              {duration}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{category}</div>
            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {title}
            </h4>
          </div>
        </div>
      </Link>
    </div>
  );
}
