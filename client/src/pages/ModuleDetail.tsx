import { useRoute } from "wouter";
import { useModule } from "@/hooks/use-modules";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const { toast } = useToast();
  const [rating, setRating] = useState<number[]>([7]);
  const [comment, setComment] = useState("");

  const submitFeedback = useMutation({
    mutationFn: async () => {
      if (!moduleId) {
        throw new Error("Missing module ID");
      }
      const url = buildUrl(api.modules.feedback.create.path, { id: moduleId });
      const response = await apiRequest("POST", url, {
        rating: rating[0],
        comment: comment.trim() ? comment.trim() : null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thanks for rating this module.",
      });
      setComment("");
      setRating([7]);
    },
    onError: (err: any) => {
      toast({
        title: "Could not submit feedback",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
  });

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

        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Rate This Module</h2>
            <p className="text-sm text-muted-foreground">Use the slider to rate your enjoyment from 1 to 10, then add a short comment.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">1 (did not enjoy) ☹️</span>
              <span className="font-medium">{rating[0]}/10</span>
              <span className="text-muted-foreground">😊 10 (loved it)</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={rating}
              onValueChange={setRating}
              aria-label="Module enjoyment rating"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="module-feedback" className="text-sm font-medium">
              Comment
            </label>
            <Textarea
              id="module-feedback"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              placeholder="Share a quick thought about this module..."
            />
            <p className="text-xs text-muted-foreground">{comment.length}/500 characters</p>
          </div>

          <Button onClick={() => submitFeedback.mutate()} disabled={submitFeedback.isPending}>
            {submitFeedback.isPending ? "Saving..." : "Submit Feedback"}
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
