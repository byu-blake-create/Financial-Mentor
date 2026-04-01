import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface BudgetWithCategories {
  id: number;
  userId: number;
  totalAmount: string;
  period: string;
  categories: Category[];
}

export interface BudgetPeriodSummary {
  id: number;
  userId: number;
  totalAmount: string;
  period: string;
}

export interface Category {
  id: number;
  budgetId: number;
  name: string;
  allocatedAmount: string;
  color: string;
}

export const BUDGET_PERIODS_QUERY_KEY = ["/api/budget/periods"] as const;

function budgetDetailKey(budgetId: number) {
  return [api.budget.get.path, budgetId] as const;
}

export function useBudgetPeriods() {
  return useQuery({
    queryKey: BUDGET_PERIODS_QUERY_KEY,
    queryFn: async (): Promise<BudgetPeriodSummary[]> => {
      const res = await fetch("/api/budget/periods", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budget periods");
      const data = (await res.json()) as { periods: BudgetPeriodSummary[] };
      return data.periods;
    },
  });
}

export function useBudget(budgetId: number | undefined) {
  return useQuery({
    queryKey: budgetId != null ? budgetDetailKey(budgetId) : [api.budget.get.path, "none"],
    queryFn: async (): Promise<BudgetWithCategories | null> => {
      if (budgetId == null) return null;
      const res = await fetch(
        `${api.budget.get.path}?budgetId=${encodeURIComponent(String(budgetId))}`,
        { credentials: "include" }
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch budget");
      return (await res.json()) as BudgetWithCategories;
    },
    enabled: budgetId != null,
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: {
      budgetId: number;
      totalAmount?: string;
      period?: string;
    }) => {
      const res = await fetch(api.budget.get.path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update budget");
      return (await res.json()) as BudgetWithCategories;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_PERIODS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: budgetDetailKey(variables.budgetId) });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useCreateBudgetPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { totalAmount: string; period: string }) => {
      const res = await fetch("/api/budget/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create budget period");
      return (await res.json()) as BudgetWithCategories;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_PERIODS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: budgetDetailKey(data.id) });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useDeleteBudgetPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (budgetId: number) => {
      const res = await fetch(`/api/budget/periods/${budgetId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Failed to delete budget period");
      }
      return budgetId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_PERIODS_QUERY_KEY });
      queryClient.removeQueries({ queryKey: budgetDetailKey(deletedId) });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: {
      budgetId: number;
      name: string;
      allocatedAmount: string;
      color: string;
    }) => {
      const res = await fetch("/api/budget/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(category),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return (await res.json()) as Category;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_PERIODS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: budgetDetailKey(variables.budgetId) });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Category> }) => {
      const res = await fetch(`/api/budget/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return (await res.json()) as Category;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_PERIODS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: budgetDetailKey(data.budgetId) });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: number; budgetId: number }) => {
      const res = await fetch(`/api/budget/categories/${args.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      return args;
    },
    onSuccess: (args) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_PERIODS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: budgetDetailKey(args.budgetId) });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}
