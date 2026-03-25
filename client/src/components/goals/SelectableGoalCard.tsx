import { motion } from "framer-motion";
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
    <motion.div
      layout
      whileHover={{ scale: isAdded ? 1 : 1.02 }}
      whileTap={{ scale: isAdded ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
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
          "relative overflow-hidden border-2 p-4 text-left transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isAdded
            ? "border-emerald-500/40 bg-emerald-500/5 cursor-default opacity-90"
            : "border-transparent hover:border-primary/25 hover:bg-muted/40 cursor-pointer active:bg-muted/60",
        )}
      >
        <div className="flex gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
              categoryAccent,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground leading-snug text-sm md:text-base">
                {preset.title}
              </h3>
              {isAdded ? (
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label="Already added"
                />
              ) : (
                <Plus className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {preset.description}
            </p>
            <p className="text-[11px] md:text-xs font-medium text-primary/90 pt-1">
              Suggested: {formatGoalAmount(preset.defaultTarget, preset.unit)}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
