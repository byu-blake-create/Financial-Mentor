import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useModule, useUpdateModuleProgress } from "@/hooks/use-modules";
import { useRoute } from "wouter";
import { useState } from "react";
import { useModule, useSubmitModuleFeedback, useUpdateModuleProgress } from "@/hooks/use-modules";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Bookmark, Check, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Bookmark, Check, PlayCircle } from "lucide-react";
import { Link, useRoute } from "wouter";

function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;

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

  if (url.includes("youtube.com/embed/")) {
    return url;
  }

  return null;
}

export default function ModuleDetail() {
  const [, params] = useRoute("/modules/:id");
  const moduleId = params ? parseInt(params.id, 10) : null;
  const { data: module, isLoading, error } = useModule(moduleId || 0);
  const updateProgress = useUpdateModuleProgress();
  const submitFeedback = useSubmitModuleFeedback();
  const { toast } = useToast();
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState("");

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

  const embedUrl = getYouTubeEmbedUrl(module.videoUrl);
  const progressPending =
    updateProgress.isPending && updateProgress.variables?.moduleId === module.id;

  const saveProgress = async (patch: { watched?: boolean; watchLater?: boolean }) => {
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

  const onSubmitFeedback = async () => {
    try {
      await submitFeedback.mutateAsync({
        moduleId: module.id,
        rating,
        comment: comment.trim() ? comment.trim() : null,
      });
      toast({
        title: "Feedback submitted",
        description: "Thanks for rating this module.",
      });
      setComment("");
      setRating(7);
    } catch (e: unknown) {
      toast({
        title: "Could not submit feedback",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/modules" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Modules
      </Link>

      <div className="space-y-6">
        <div>
          <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
            {module.category}
          </div>
          <h1 className="text-4xl font-bold font-display mb-4">{module.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {module.description}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              type="button"
              variant={module.watched ? "secondary" : "default"}
              disabled={progressPending}
              onClick={() =>
                saveProgress({
                  watched: !module.watched,
                  watchLater: module.watched ? module.watchLater : false,
                })
              }
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {module.watched ? "Mark as not watched" : "Mark as watched"}
            </Button>
            <Button
              type="button"
              variant={module.watchLater ? "secondary" : "outline"}
              disabled={progressPending}
              onClick={() => saveProgress({ watchLater: !module.watchLater })}
              className="gap-2"
            >
              <Bookmark className={cn("h-4 w-4", module.watchLater && "fill-current")} />
              {module.watchLater ? "Remove from watch later" : "Watch later"}
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

        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-semibold font-display">Rate This Module</h2>
            <p className="text-muted-foreground mt-1">
              Use the slider to rate your enjoyment from 1 to 10, then add a short comment.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>1 (did not enjoy)</span>
              <span className="text-base font-semibold text-foreground">{rating}/10</span>
              <span>10 (loved it)</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[rating]}
              onValueChange={(value) => setRating(value[0] ?? 7)}
              aria-label="Module enjoyment rating"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comment</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Share what you liked or what could be improved"
              rows={4}
            />
            <div className="text-xs text-muted-foreground">{comment.length}/500 characters</div>
          </div>

          <Button type="button" onClick={onSubmitFeedback} disabled={submitFeedback.isPending}>
            {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
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
