import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Define the response type based on the schema/routes
// Since the schema export might not be perfectly inferred in this environment, 
// we'll define a compatible interface here for the hook return type
export interface DashboardData {
  budget: {
    totalAmount: string;
    period: string;
    categories: Array<{
      id: number;
      name: string;
      allocatedAmount: string;
      color: string;
    }>;
  } | null;
  recentTransactions: Array<{
    id: number;
    amount: string;
    description: string;
    date: string;
  }>;
  modules: {
    recent: Array<{
      id: number;
      title: string;
      description: string;
      imageUrl: string | null;
      category: string;
    }>;
    recommended: Array<{
      id: number;
      title: string;
      description: string;
      imageUrl: string | null;
      category: string;
    }>;
  };
}

export function useDashboardData() {
  return useQuery({
    queryKey: [api.dashboard.get.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return await res.json() as DashboardData;
    },
  });
}
