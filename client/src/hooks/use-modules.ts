import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  buildUrl,
  type ModuleProgressUpdateRequest,
  type ModuleResponse,
  type ModulesListResponse,
} from "@shared/routes";

export type Module = ModuleResponse;

export interface ModuleFeedbackInput {
  moduleId: number;
  rating: number;
  comment?: string | null;
}

export interface ModuleFeedbackResponse {
  id: number;
  userId: number;
  moduleId: number;
  rating: number;
  comment: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function useModules() {
  return useQuery({
    queryKey: [api.modules.list.path],
    queryFn: async () => {
      const res = await fetch(api.modules.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch modules");
      return (await res.json()) as ModulesListResponse;
    },
  });
}

export function useModule(id: number) {
  return useQuery({
    queryKey: [api.modules.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.modules.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch module");
      return (await res.json()) as Module;
    },
    enabled: !!id,
  });
}

export function useUpdateModuleProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { moduleId: number } & ModuleProgressUpdateRequest) => {
      const url = buildUrl(api.modules.progress.path, { id: input.moduleId });
      const { moduleId: _moduleId, ...body } = input;
      const res = await fetch(url, {
        method: api.modules.progress.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "Failed to update progress");
      }
      return (await res.json()) as Module;
    },
    onSuccess: (updatedModule, variables) => {
      queryClient.setQueryData([api.modules.get.path, variables.moduleId], updatedModule);
      queryClient.invalidateQueries({ queryKey: [api.modules.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.modules.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}

export function useSubmitModuleFeedback() {
  return useMutation({
    mutationFn: async (input: ModuleFeedbackInput) => {
      const url = buildUrl(api.modules.feedback.path, { id: input.moduleId });
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: input.rating,
          comment: input.comment ?? null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "Failed to submit feedback");
      }

      return (await res.json()) as ModuleFeedbackResponse;
    },
  });
}
