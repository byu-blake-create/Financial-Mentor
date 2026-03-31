import { useRoute } from "wouter";
import { useModule, useUpdateModuleProgress } from "@/hooks/use-modules";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bookmark, CheckCircle2, PlayCircle } from "lucide-react";
import { Link } from "wouter";

// Convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  // If it's already an embed URL, return as is
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  return null;
}

export default function ModuleDetail() {
  const [, params] = useRoute("/modules/:id");
  const moduleId = params ? parseInt(params.id, 10) : null;
  const { data: module, isLoading, error } = useModule(moduleId || 0);
  const updateProgress = useUpdateModuleProgress(moduleId || 0);
  const { toast } = useToast();

  if (isLoading) {
    return <ModuleDetailSkeleton />;
  }

  if (error || !module) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <Link href="/modules" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Modules
        </Link>
        <div className="bg-card rounded-2xl border shadow-sm p-8 text-center">
          <p className="text-muted-foreground">Module not found</p>
        </div>
      </div>
    );
  }

  const currentModule = module;
  const embedUrl = getYouTubeEmbedUrl(currentModule.videoUrl);
  const isUpdating = updateProgress.isPending;

  async function handleToggleWatched() {
    try {
      await updateProgress.mutateAsync({
        watched: !currentModule.watched,
        watchLater: currentModule.watched ? currentModule.watchLater : false,
      });
    } catch {
      toast({
        title: "Could not update module",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleToggleWatchlist() {
    try {
      await updateProgress.mutateAsync({
        watchLater: !currentModule.watchLater,
      });
    } catch {
      toast({
        title: "Could not update watchlist",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/modules" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Modules
      </Link>

      <div className="space-y-6">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="text-xs font-semibold text-primary uppercase tracking-wider">
              {module.category}
            </div>
            {module.watched && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Watched
              </Badge>
            )}
            {module.watchLater && !module.watched && (
              <Badge variant="outline" className="gap-1">
                <Bookmark className="w-3 h-3" />
                Watchlist
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-bold font-display mb-4">{module.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {module.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              variant={module.watched ? "outline" : "default"}
              onClick={handleToggleWatched}
              disabled={isUpdating}
            >
              <CheckCircle2 className="w-4 h-4" />
              {module.watched ? "Mark Unwatched" : "Mark Watched"}
            </Button>
            <Button
              type="button"
              variant={module.watchLater ? "secondary" : "outline"}
              onClick={handleToggleWatchlist}
              disabled={isUpdating}
            >
              <Bookmark className="w-4 h-4" />
              {module.watchLater ? "Remove From Watchlist" : "Add To Watchlist"}
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {embedUrl ? (
            <div className="relative aspect-video w-full">
              <iframe
                src={embedUrl}
                title={module.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full bg-muted flex items-center justify-center">
              <div className="text-center space-y-4">
                <PlayCircle className="w-16 h-16 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Video not available</p>
                {module.videoUrl && (
                  <a
                    href={module.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    Open video link
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <Skeleton className="aspect-video w-full rounded-2xl" />
      </div>
    </div>
  );
}
