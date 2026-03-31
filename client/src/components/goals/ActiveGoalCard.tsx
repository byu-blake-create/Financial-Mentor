import { useMemo } from "react";
import { formatDistanceToNowStrict, isPast } from "date-fns";
import type { ActiveGoal } from "@/hooks/use-financial-goals";
import { formatGoalAmount } from "@/lib/financial-goals-data";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, Pencil } from "lucide-react";

type ActiveGoalCardProps = {
  goal: ActiveGoal;
  onSavedChange: (saved: number) => void;
  onEdit: () => void;
  onRemove: () => void;
};

export function ActiveGoalCard({ goal, onSavedChange, onEdit, onRemove }: ActiveGoalCardProps) {
  const pct = useMemo(() => {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
  }, [goal.savedAmount, goal.targetAmount]);

  const deadlineLabel = useMemo(() => {
    if (!goal.deadline) return null;
    const d = new Date(goal.deadline);
    if (Number.isNaN(d.getTime())) return null;
    if (isPast(d)) return "Deadline passed — still proud of the progress!";
    return `${formatDistanceToNowStrict(d, { addSuffix: true })}`;
  }, [goal.deadline]);

  const isComplete = pct >= 100;

  return (
    <Card className="overflow-hidden border p-4 md:p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-medium text-xs">
                  {goal.categoryLabel}
                </Badge>
                {isComplete && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                    Complete
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-bold font-display leading-tight">{goal.title}</h3>
              {goal.description ? (
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-1 self-end sm:self-start">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                aria-label="Remove goal"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold tabular-nums">
                {formatGoalAmount(goal.savedAmount, goal.unit)} /{" "}
                {formatGoalAmount(goal.targetAmount, goal.unit)}
              </span>
            </div>
            <Progress value={pct} className="h-3" />
          </div>

          {deadlineLabel && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{deadlineLabel}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-xs font-medium text-muted-foreground sm:w-32 shrink-0">
              Update progress
            </label>
            <div className="flex gap-2 flex-1">
              <Input
                type="number"
                min={0}
                step={goal.unit === "usd" ? 1 : 1}
                value={goal.savedAmount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    onSavedChange(0);
                    return;
                  }
                  const v = parseFloat(raw);
                  onSavedChange(Number.isFinite(v) ? v : 0);
                }}
                className="tabular-nums"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => onSavedChange(Math.min(goal.targetAmount, goal.savedAmount + (goal.unit === "usd" ? 25 : 1)))}
              >
                +{goal.unit === "usd" ? "$25" : goal.unit === "weeks" ? "1 wk" : "1 day"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
  );
}
