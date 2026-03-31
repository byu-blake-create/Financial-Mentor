import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useFinancialGoals, type ActiveGoal } from "@/hooks/use-financial-goals";
import type { PresetGoalDefinition } from "@/lib/financial-goals-data";
import {
  GOAL_CATEGORIES,
  PRESET_GOALS,
  getCategoryMeta,
  type GoalCategoryId,
} from "@/lib/financial-goals-data";
import { SelectableGoalCard } from "@/components/goals/SelectableGoalCard";
import { ActiveGoalCard } from "@/components/goals/ActiveGoalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Flame, Target, Sparkles, Filter } from "lucide-react";
export default function FinancialGoals() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    goals,
    streakDays,
    hydrated,
    addPresetGoal,
    addCustomGoal,
    updateSaved,
    updateGoalDetails,
    removeGoal,
    stats,
  } = useFinancialGoals(userId);

  const [filter, setFilter] = useState<"all" | GoalCategoryId>("all");
  const [presetDialog, setPresetDialog] = useState<PresetGoalDefinition | null>(null);
  const [presetTarget, setPresetTarget] = useState("");
  const [presetDeadline, setPresetDeadline] = useState("");

  const [customOpen, setCustomOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [customCategory, setCustomCategory] = useState<GoalCategoryId | "">("");
  const [customDeadline, setCustomDeadline] = useState("");

  const [editGoal, setEditGoal] = useState<ActiveGoal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editCategory, setEditCategory] = useState<GoalCategoryId | "">("");
  const [editDeadline, setEditDeadline] = useState("");

  const filteredPresets = useMemo(() => {
    if (filter === "all") return PRESET_GOALS;
    return PRESET_GOALS.filter((g) => g.categoryId === filter);
  }, [filter]);

  const openPresetDialog = (p: PresetGoalDefinition) => {
    setPresetDialog(p);
    setPresetTarget(String(p.defaultTarget));
    setPresetDeadline("");
  };

  const confirmPreset = () => {
    if (!presetDialog) return;
    const t = parseFloat(presetTarget);
    if (!Number.isFinite(t) || t <= 0) {
      toast({
        title: "Check your target",
        description: "Enter a positive number for your goal.",
        variant: "destructive",
      });
      return;
    }
    const deadlineIso = presetDeadline
      ? new Date(presetDeadline + "T12:00:00").toISOString()
      : null;
    const ok = addPresetGoal(presetDialog.id, t, deadlineIso);
    if (!ok) {
      toast({
        title: "Already on your list",
        description: "This goal is already active. Pick another or remove it first.",
      });
    } else {
      toast({
        title: "Goal added!",
        description: "You’ve got this — update progress anytime.",
      });
    }
    setPresetDialog(null);
  };

  const submitCustom = () => {
    const title = customTitle.trim();
    const t = parseFloat(customTarget);
    if (!title) {
      toast({ title: "Name your goal", description: "Add a short title.", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(t) || t <= 0) {
      toast({
        title: "Set a target amount",
        description: "Use a positive dollar amount.",
        variant: "destructive",
      });
      return;
    }
    const deadlineIso = customDeadline
      ? new Date(customDeadline + "T12:00:00").toISOString()
      : null;
    addCustomGoal({
      title,
      targetAmount: t,
      deadline: deadlineIso,
      categoryId: customCategory || undefined,
    });
    toast({ title: "Custom goal created", description: "Nice — it’s on your dashboard." });
    setCustomOpen(false);
    setCustomTitle("");
    setCustomTarget("");
    setCustomCategory("");
    setCustomDeadline("");
  };

  const openEditGoal = (goal: ActiveGoal) => {
    setEditGoal(goal);
    setEditTitle(goal.title);
    setEditTarget(String(goal.targetAmount));
    setEditCategory(goal.categoryId ?? "");
    setEditDeadline(goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : "");
  };

  const closeEditDialog = () => {
    setEditGoal(null);
    setEditTitle("");
    setEditTarget("");
    setEditCategory("");
    setEditDeadline("");
  };

  const submitEdit = () => {
    if (!editGoal) return;
    const title = editTitle.trim();
    const t = parseFloat(editTarget);

    if (!title) {
      toast({ title: "Name your goal", description: "Add a short title.", variant: "destructive" });
      return;
    }

    if (!Number.isFinite(t) || t <= 0) {
      toast({
        title: "Set a target amount",
        description: "Use a positive target amount.",
        variant: "destructive",
      });
      return;
    }

    const deadlineIso = editDeadline
      ? new Date(editDeadline + "T12:00:00").toISOString()
      : null;

    const ok = updateGoalDetails({
      goalId: editGoal.id,
      title,
      targetAmount: t,
      deadline: deadlineIso,
      categoryId: editCategory || undefined,
    });

    if (!ok) {
      toast({
        title: "Could not update goal",
        description: "Try opening the goal again.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Goal updated", description: "Your changes have been saved." });
    closeEditDialog();
  };

  const isPresetActive = (id: string) =>
    goals.some((g) => g.kind === "preset" && g.presetId === id);

  if (!hydrated || userId == null) {
    return (
      <div className="space-y-6 animate-pulse max-w-3xl">
        <div className="h-10 bg-muted rounded-lg w-2/3" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-8 animate-in fade-in duration-500">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="gap-1.5 pl-2 pr-2.5 py-1 font-semibold bg-orange-500/15 text-orange-900 dark:text-orange-100 border-orange-500/20"
          >
            <Flame className="h-3.5 w-3.5" />
            {streakDays > 0 ? `${streakDays}-day streak` : "Start your streak"}
          </Badge>
          <Badge variant="outline" className="gap-1 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            {stats.completedCount} completed
          </Badge>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">
            Financial goals
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Pick a path, name your target, and watch the bar move. Small wins beat perfect plans.
          </p>
        </div>
      </header>

      {/* Active dashboard */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold font-display flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your active goals
            </h2>
            <p className="text-sm text-muted-foreground">
              {goals.length === 0
                ? "Nothing here yet — add a goal below."
                : `${goals.length} goal${goals.length === 1 ? "" : "s"} in motion`}
            </p>
          </div>
          <Button onClick={() => setCustomOpen(true)} className="rounded-xl shrink-0">
            + Create custom goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 p-8 text-center"
          >
            <p className="font-semibold text-foreground">Ready when you are</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Choose a starter goal from the library or create your own. Progress saves on this device.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {goals.map((g) => (
              <ActiveGoalCard
                key={g.id}
                goal={g}
                onSavedChange={(v) => updateSaved(g.id, v)}
                onEdit={() => openEditGoal(g)}
                onRemove={() => {
                  removeGoal(g.id);
                  toast({ title: "Goal removed" });
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Library */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold font-display">Goal library</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-4 w-4" />
              Filter by category — tap a card to add
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin [scrollbar-width:thin]">
          <Button
            type="button"
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-full shrink-0"
            onClick={() => setFilter("all")}
          >
            All goals
          </Button>
          {GOAL_CATEGORIES.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant={filter === c.id ? "default" : "outline"}
              size="sm"
              className="rounded-full shrink-0 gap-1.5"
              onClick={() => setFilter(c.id)}
            >
              <c.icon className="h-3.5 w-3.5" />
              {c.label}
            </Button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {filteredPresets.map((preset) => {
            const meta = getCategoryMeta(preset.categoryId);
            return (
              <SelectableGoalCard
                key={preset.id}
                preset={preset}
                categoryAccent={meta.accentClass}
                isAdded={isPresetActive(preset.id)}
                onSelect={() => openPresetDialog(preset)}
              />
            );
          })}
        </div>
      </section>

      {/* Add preset dialog */}
      <Dialog open={!!presetDialog} onOpenChange={(o) => !o && setPresetDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {presetDialog?.title}
            </DialogTitle>
            <DialogDescription>{presetDialog?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="preset-target">
                {presetDialog?.unit === "usd" && "Target ($)"}
                {presetDialog?.unit === "days" && "Target (days)"}
                {presetDialog?.unit === "weeks" && "Target (weeks)"}
              </Label>
              <Input
                id="preset-target"
                type="number"
                min={1}
                step={1}
                value={presetTarget}
                onChange={(e) => setPresetTarget(e.target.value)}
                className="tabular-nums"
              />
              {presetDialog?.unit !== "usd" && (
                <p className="text-xs text-muted-foreground">
                  Update your progress in {presetDialog?.unit === "weeks" ? "weeks" : "days"} on the card below.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-deadline">Deadline (optional)</Label>
              <Input
                id="preset-deadline"
                type="date"
                value={presetDeadline}
                onChange={(e) => setPresetDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPresetDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmPreset} className="rounded-xl">
              Add to my goals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom goal dialog */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create a custom goal</DialogTitle>
            <DialogDescription>
              Name it, set a dollar target, and optionally pick a category or deadline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="custom-title">Goal name</Label>
              <Input
                id="custom-title"
                placeholder="e.g. Spring break fund"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-target">Target amount ($)</Label>
              <Input
                id="custom-target"
                type="number"
                min={1}
                step={1}
                placeholder="500"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select
                value={customCategory || "none"}
                onValueChange={(v) =>
                  setCustomCategory(v === "none" ? "" : (v as GoalCategoryId))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vibe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {GOAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-deadline">Deadline (optional)</Label>
              <Input
                id="custom-deadline"
                type="date"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCustom} className="rounded-xl">
              Save goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit goal dialog */}
      <Dialog open={!!editGoal} onOpenChange={(o) => !o && closeEditDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit goal</DialogTitle>
            <DialogDescription>
              Update the name, target, category, or deadline for this goal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Goal name</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-target">
                Target amount {editGoal?.unit === "usd" ? "($)" : `(${editGoal?.unit})`}
              </Label>
              <Input
                id="edit-target"
                type="number"
                min={1}
                step={1}
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select
                value={editCategory || "none"}
                onValueChange={(v) =>
                  setEditCategory(v === "none" ? "" : (v as GoalCategoryId))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {GOAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Deadline (optional)</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={submitEdit} className="rounded-xl">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
