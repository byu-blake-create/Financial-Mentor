import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export interface Module {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  imageUrl: string | null;
  category: string;
}

export interface ModulesListResponse {
  keepLearning: Module[];
  suggested: Module[];
  popular: Module[];
  all: Module[];
}

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
      return await res.json() as Module;
    },
    enabled: !!id,
  });
}
