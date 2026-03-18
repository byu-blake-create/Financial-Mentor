import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface Transaction {
  id: number;
  userId: string;
  amount: string;
  description: string;
  date: string;
  categoryId: number | null;
}

export function useTransactions() {
  return useQuery({
    queryKey: [api.transactions.list.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return await res.json() as Transaction[];
    },
  });
}
