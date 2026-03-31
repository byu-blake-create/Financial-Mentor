import type { PresetGoalDefinition } from "@/lib/financial-goals-data";
import { formatGoalAmount } from "@/lib/financial-goals-data";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Plus } from "lucide-react";

type SelectableGoalCardProps = {
  preset: PresetGoalDefinition;
  categoryAccent: string;
  isAdded: boolean;
  onSelect: () => void;
};

export function SelectableGoalCard({
  preset,
  categoryAccent,
  isAdded,
  onSelect,
}: SelectableGoalCardProps) {
  const Icon = preset.icon;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => !isAdded && onSelect()}
      onKeyDown={(e) => {
        if (!isAdded && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "relative overflow-hidden border p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isAdded
          ? "border-emerald-300 bg-emerald-50/40 cursor-default"
          : "hover:bg-muted/40 cursor-pointer",
      )}
    >
        <div className="flex gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              categoryAccent,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground leading-snug text-sm">
                {preset.title}
              </h3>
              {isAdded ? (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  aria-label="Already added"
                />
              ) : (
                <Plus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {preset.description}
            </p>
            <p className="text-xs font-medium text-muted-foreground pt-1">
              Suggested: {formatGoalAmount(preset.defaultTarget, preset.unit)}
            </p>
          </div>
        </div>
      </Card>
  );
}
