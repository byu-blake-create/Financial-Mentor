import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { Goal } from "@shared/schema";
import type { GoalCategoryId, ProgressUnit } from "@/lib/financial-goals-data";
import { getPresetById, GOAL_CATEGORIES } from "@/lib/financial-goals-data";

export type ActiveGoal = {
  id: string;
  dbId: number;
  kind: "preset" | "custom";
  presetId?: string;
  title: string;
  description: string;
  categoryLabel: string;
  categoryId?: GoalCategoryId;
  targetAmount: number;
  savedAmount: number;
  unit: ProgressUnit;
  deadline: string | null;
  createdAt: string;
};

function goalToActive(g: Goal): ActiveGoal {
  return {
    id: String(g.id),
    dbId: g.id,
    kind: (g.kind === "preset" ? "preset" : "custom") as "preset" | "custom",
    presetId: g.presetId ?? undefined,
    title: g.title,
    description: g.description ?? "",
    categoryLabel: g.categoryLabel ?? "Goal",
    categoryId: (g.categoryId ?? undefined) as GoalCategoryId | undefined,
    targetAmount: parseFloat(String(g.targetAmount)) || 0,
    savedAmount: parseFloat(String(g.savedAmount)) || 0,
    unit: (g.unit ?? "usd") as ProgressUnit,
    deadline: g.deadline ? new Date(String(g.deadline)).toISOString() : null,
    createdAt: g.createdAt ? new Date(String(g.createdAt)).toISOString() : new Date().toISOString(),
  };
}

const GOALS_KEY = [api.goals.list.path];

export function useFinancialGoals(userId: number | undefined) {
  const qc = useQueryClient();

  const { data: rawGoals, isLoading } = useQuery({
    queryKey: GOALS_KEY,
    queryFn: async () => {
      const res = await fetch(api.goals.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch goals");
      return (await res.json()) as Goal[];
    },
    enabled: userId != null,
  });

  const goals: ActiveGoal[] = useMemo(
    () => (rawGoals ?? []).map(goalToActive),
    [rawGoals],
  );

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(api.goals.list.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return (await res.json()) as Goal;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: number } & Record<string, unknown>) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return (await res.json()) as Goal;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete goal");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });

  const addPresetGoal = useCallback(
    (presetId: string, targetAmount: number, deadline: string | null) => {
      const preset = getPresetById(presetId);
      if (!preset) return false;
      if (goals.some((g) => g.kind === "preset" && g.presetId === presetId)) {
        return false;
      }
      const cat = GOAL_CATEGORIES.find((c) => c.id === preset.categoryId);
      createMutation.mutate({
        kind: "preset",
        presetId: preset.id,
        title: preset.title,
        description: preset.description,
        categoryLabel: cat?.label ?? "Goal",
        categoryId: preset.categoryId,
        targetAmount,
        savedAmount: 0,
        unit: preset.unit,
        deadline,
      });
      return true;
    },
    [goals, createMutation],
  );

  const addCustomGoal = useCallback(
    (input: {
      title: string;
      targetAmount: number;
      unit?: ProgressUnit;
      deadline: string | null;
      categoryId?: GoalCategoryId;
    }) => {
      const cat = input.categoryId
        ? GOAL_CATEGORIES.find((c) => c.id === input.categoryId)
        : undefined;
      const unit = input.unit ?? "usd";
      createMutation.mutate({
        kind: "custom",
        title: input.title.trim(),
        description: unit === "none"
          ? "A milestone goal — mark it done when you're ready."
          : "Your custom goal — keep it visible and keep going.",
        categoryLabel: cat?.label ?? "Custom",
        categoryId: input.categoryId ?? null,
        targetAmount: input.targetAmount,
        savedAmount: 0,
        unit,
        deadline: input.deadline,
      });
    },
    [createMutation],
  );

  const updateSaved = useCallback(
    (goalId: string, savedAmount: number) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;
      updateMutation.mutate({ id: goal.dbId, savedAmount: Math.max(0, savedAmount) });
    },
    [goals, updateMutation],
  );

  const updateGoalDetails = useCallback(
    (input: {
      goalId: string;
      title: string;
      targetAmount: number;
      deadline: string | null;
      categoryId?: GoalCategoryId;
    }) => {
      const goal = goals.find((g) => g.id === input.goalId);
      if (!goal) return false;

      const title = input.title.trim();
      if (!title) return false;

      const cat = input.categoryId
        ? GOAL_CATEGORIES.find((c) => c.id === input.categoryId)
        : undefined;

      updateMutation.mutate({
        id: goal.dbId,
        title,
        targetAmount: input.targetAmount,
        deadline: input.deadline,
        categoryId: input.categoryId ?? null,
        categoryLabel: cat?.label ?? (goal.kind === "custom" ? "Custom" : "Goal"),
      });
      return true;
    },
    [goals, updateMutation],
  );

  const removeGoal = useCallback(
    (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;
      deleteMutation.mutate(goal.dbId);
    },
    [goals, deleteMutation],
  );

  const streakDays = 0;

  const stats = useMemo(() => {
    const completed = goals.filter(
      (g) => g.savedAmount >= g.targetAmount && g.targetAmount > 0,
    ).length;
    return { activeCount: goals.length, completedCount: completed };
  }, [goals]);

  return {
    goals,
    streakDays,
    lastProgressDate: null as string | null,
    hydrated: !isLoading,
    addPresetGoal,
    addCustomGoal,
    updateSaved,
    updateGoalDetails,
    removeGoal,
    stats,
  };
}
