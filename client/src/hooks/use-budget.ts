import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface BudgetWithCategories {
  id: number;
  userId: string;
  totalAmount: string;
  period: string;
  categories: Category[];
}

export interface Category {
  id: number;
  budgetId: number;
  name: string;
  allocatedAmount: string;
  color: string;
}

export function useBudget() {
  return useQuery({
    queryKey: [api.budget.get.path],
    queryFn: async () => {
      const res = await fetch(api.budget.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budget");
      return await res.json() as BudgetWithCategories;
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { totalAmount?: string; period?: string }) => {
      const res = await fetch(api.budget.get.path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update budget");
      return await res.json() as BudgetWithCategories;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.budget.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: { name: string; allocatedAmount: string; color: string }) => {
      const res = await fetch("/api/budget/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(category),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return await res.json() as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.budget.get.path] });
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
      return await res.json() as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.budget.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/budget/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.budget.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}
