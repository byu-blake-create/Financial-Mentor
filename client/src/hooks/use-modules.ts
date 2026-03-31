import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  buildUrl,
  type ModuleProgressUpdateRequest,
  type ModuleResponse,
  type ModulesListResponse,
} from "@shared/routes";

export type LearningModule = ModuleResponse;

export function useModules() {
  return useQuery({
    queryKey: [api.modules.list.path],
    queryFn: async () => {
      const res = await fetch(api.modules.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch modules");
      return await res.json() as ModulesListResponse;
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
      return await res.json() as LearningModule;
    },
    enabled: !!id,
  });
}

export function useUpdateModuleProgress(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ModuleProgressUpdateRequest) => {
      const url = buildUrl(api.modules.progress.path, { id });
      const res = await fetch(url, {
        method: api.modules.progress.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update module progress");
      return await res.json() as LearningModule;
    },
    onSuccess: (updatedModule) => {
      queryClient.setQueryData([api.modules.get.path, id], updatedModule);
      queryClient.invalidateQueries({ queryKey: [api.modules.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.get.path] });
    },
  });
}
