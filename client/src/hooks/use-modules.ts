import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export interface Module {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  imageUrl: string | null;
  category: string;
  watched?: boolean;
  watchLater?: boolean;
}

export interface ModulesListResponse {
  suggested: Module[];
  popular: Module[];
  all: Module[];
  watchLater: Module[];
  watched: Module[];
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
    mutationFn: async (input: { moduleId: number; watched?: boolean; watchLater?: boolean }) => {
      const url = `/api/modules/${input.moduleId}/progress`;
      const { moduleId: _id, ...body } = input;
      const res = await fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "Failed to update progress");
      }
      return (await res.json()) as { moduleId: number; watched: boolean; watchLater: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.modules.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.modules.get.path] });
    },
  });
}
