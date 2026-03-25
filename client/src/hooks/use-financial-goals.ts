import { useCallback, useEffect, useMemo, useState } from "react";
import type { GoalCategoryId, ProgressUnit } from "@/lib/financial-goals-data";
import { getPresetById } from "@/lib/financial-goals-data";
import { GOAL_CATEGORIES } from "@/lib/financial-goals-data";

const STORAGE_VERSION = 1;

export type ActiveGoal = {
  id: string;
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

type PersistedPayload = {
  v: number;
  goals: ActiveGoal[];
  streakDays: number;
  lastProgressDate: string | null;
};

function storageKey(userId: number) {
  return `prosper-financial-goals-v${STORAGE_VERSION}-${userId}`;
}

function loadFromStorage(userId: number): PersistedPayload {
  if (typeof window === "undefined") {
    return { v: STORAGE_VERSION, goals: [], streakDays: 0, lastProgressDate: null };
  }
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      return { v: STORAGE_VERSION, goals: [], streakDays: 0, lastProgressDate: null };
    }
    const parsed = JSON.parse(raw) as PersistedPayload;
    if (!parsed || !Array.isArray(parsed.goals)) {
      return { v: STORAGE_VERSION, goals: [], streakDays: 0, lastProgressDate: null };
    }
    return {
      v: STORAGE_VERSION,
      goals: parsed.goals,
      streakDays: typeof parsed.streakDays === "number" ? parsed.streakDays : 0,
      lastProgressDate:
        typeof parsed.lastProgressDate === "string" || parsed.lastProgressDate === null
          ? parsed.lastProgressDate
          : null,
    };
  } catch {
    return { v: STORAGE_VERSION, goals: [], streakDays: 0, lastProgressDate: null };
  }
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function bumpStreak(prev: PersistedPayload): Pick<PersistedPayload, "streakDays" | "lastProgressDate"> {
  const today = todayYmd();
  if (prev.lastProgressDate === today) {
    return { streakDays: prev.streakDays, lastProgressDate: prev.lastProgressDate };
  }
  if (prev.lastProgressDate === yesterdayYmd() || prev.lastProgressDate === null) {
    const next =
      prev.lastProgressDate === null ? 1 : prev.streakDays + 1;
    return { streakDays: next, lastProgressDate: today };
  }
  return { streakDays: 1, lastProgressDate: today };
}

export function useFinancialGoals(userId: number | undefined) {
  const [goals, setGoals] = useState<ActiveGoal[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [lastProgressDate, setLastProgressDate] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (userId == null) return;
    const data = loadFromStorage(userId);
    setGoals(data.goals);
    setStreakDays(data.streakDays);
    setLastProgressDate(data.lastProgressDate);
    setHydrated(true);
  }, [userId]);

  const persist = useCallback(
    (next: ActiveGoal[], streak: number, last: string | null) => {
      if (userId == null) return;
      setGoals(next);
      setStreakDays(streak);
      setLastProgressDate(last);
      const payload: PersistedPayload = {
        v: STORAGE_VERSION,
        goals: next,
        streakDays: streak,
        lastProgressDate: last,
      };
      localStorage.setItem(storageKey(userId), JSON.stringify(payload));
    },
    [userId],
  );

  const addPresetGoal = useCallback(
    (presetId: string, targetAmount: number, deadline: string | null) => {
      const preset = getPresetById(presetId);
      if (!preset || userId == null) return false;
      const data = loadFromStorage(userId);
      if (data.goals.some((g) => g.kind === "preset" && g.presetId === presetId)) {
        return false;
      }

      const cat = GOAL_CATEGORIES.find((c) => c.id === preset.categoryId);
      const goal: ActiveGoal = {
        id: crypto.randomUUID(),
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
        createdAt: new Date().toISOString(),
      };
      persist([...data.goals, goal], data.streakDays, data.lastProgressDate);
      return true;
    },
    [persist, userId],
  );

  const addCustomGoal = useCallback(
    (input: {
      title: string;
      targetAmount: number;
      deadline: string | null;
      categoryId?: GoalCategoryId;
    }) => {
      if (userId == null) return;
      const data = loadFromStorage(userId);
      const cat = input.categoryId
        ? GOAL_CATEGORIES.find((c) => c.id === input.categoryId)
        : undefined;
      const goal: ActiveGoal = {
        id: crypto.randomUUID(),
        kind: "custom",
        title: input.title.trim(),
        description: "Your custom goal—keep it visible and keep going.",
        categoryLabel: cat?.label ?? "Custom",
        categoryId: input.categoryId,
        targetAmount: input.targetAmount,
        savedAmount: 0,
        unit: "usd",
        deadline: input.deadline,
        createdAt: new Date().toISOString(),
      };
      persist([...data.goals, goal], data.streakDays, data.lastProgressDate);
    },
    [persist, userId],
  );

  const updateSaved = useCallback(
    (goalId: string, savedAmount: number) => {
      if (userId == null) return;
      const prevPayload = loadFromStorage(userId);
      const streakUpdate = bumpStreak(prevPayload);
      const next = prevPayload.goals.map((g) =>
        g.id === goalId ? { ...g, savedAmount: Math.max(0, savedAmount) } : g,
      );
      persist(next, streakUpdate.streakDays, streakUpdate.lastProgressDate);
    },
    [persist, userId],
  );

  const removeGoal = useCallback(
    (goalId: string) => {
      if (userId == null) return;
      const data = loadFromStorage(userId);
      persist(
        data.goals.filter((g) => g.id !== goalId),
        data.streakDays,
        data.lastProgressDate,
      );
    },
    [persist, userId],
  );

  const stats = useMemo(() => {
    const completed = goals.filter(
      (g) => g.savedAmount >= g.targetAmount && g.targetAmount > 0,
    ).length;
    return { activeCount: goals.length, completedCount: completed };
  }, [goals]);

  return {
    goals,
    streakDays,
    lastProgressDate,
    hydrated,
    addPresetGoal,
    addCustomGoal,
    updateSaved,
    removeGoal,
    stats,
  };
}
