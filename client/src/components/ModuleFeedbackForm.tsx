import { useState } from "react";
import { useModuleFeedback, useSubmitModuleFeedback } from "@/hooks/use-module-feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleFeedbackFormProps {
  moduleId: number;
}

export default function ModuleFeedbackForm({ moduleId }: ModuleFeedbackFormProps) {
  const { data: existingFeedback, isLoading: isLoadingFeedback } = useModuleFeedback(moduleId);
  const { mutate: submitFeedback, isPending: isSubmitting } = useSubmitModuleFeedback();

  const [rating, setRating] = useState<number>(existingFeedback?.rating ?? 5);
  const [comment, setComment] = useState<string>(existingFeedback?.comment ?? "");
  const [isEditing, setIsEditing] = useState(!existingFeedback);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback(
      {
        moduleId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  if (isLoadingFeedback) {
    return null;
  }

  return (
    <Card className="p-6 bg-card border shadow-sm rounded-2xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Share Your Feedback</h3>
          
          {existingFeedback && !isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  How helpful was this module?
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-5 h-5",
                          i < Math.round(existingFeedback.rating / 2)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{existingFeedback.rating}/10</span>
                </div>
              </div>

              {existingFeedback.comment && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Your comment:
                  </label>
                  <p className="text-sm text-foreground">{existingFeedback.comment}</p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setRating(existingFeedback.rating);
                  setComment(existingFeedback.comment || "");
                  setIsEditing(true);
                }}
              >
                Edit Feedback
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">
                  How helpful was this module? ({rating}/10)
                </label>
                <div className="flex items-center gap-4">
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[rating]}
                    onValueChange={(value) => setRating(value[0])}
                    className="flex-1"
                  />
                  <div className="text-4xl w-12 text-center">
                    {rating === 1 && "🤮"}
                    {rating >= 2 && rating <= 4 && "😞"}
                    {rating === 5 && "😐"}
                    {rating >= 6 && rating <= 9 && "😊"}
                    {rating === 10 && "🤩"}
                  </div>
                  <span className="text-lg font-semibold w-8 text-right">{rating}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Add a comment (optional)
                </label>
                <Textarea
                  placeholder="Tell us what you thought about this module..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
                {existingFeedback && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setRating(existingFeedback.rating);
                      setComment(existingFeedback.comment || "");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </Card>
  );
}
