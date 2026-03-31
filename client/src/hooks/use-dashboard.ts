import { useQuery } from "@tanstack/react-query";
import { api, type DashboardResponse } from "@shared/routes";

export function useDashboardData() {
  return useQuery({
    queryKey: [api.dashboard.get.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return await res.json() as DashboardResponse;
    },
  });
}
