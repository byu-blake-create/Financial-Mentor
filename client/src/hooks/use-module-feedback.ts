import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export interface ModuleFeedback {
  id: number;
  userId: number;
  moduleId: number;
  rating: number;
  comment: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function useModuleFeedback(moduleId: number) {
  return useQuery({
    queryKey: ["module-feedback", moduleId],
    queryFn: async () => {
      const response = await fetch(
        buildUrl(api.feedback.get.path, { moduleId })
      );
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      return (await response.json()) as ModuleFeedback | null;
    },
  });
}

export function useSubmitModuleFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      moduleId: number;
      rating: number;
      comment?: string;
    }) => {
      const response = await fetch(
        buildUrl(api.feedback.create.path, { moduleId: data.moduleId }),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: undefined, // Will be set by server
            moduleId: data.moduleId,
            rating: data.rating,
            comment: data.comment || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit feedback");
      }

      return (await response.json()) as ModuleFeedback;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["module-feedback", data.moduleId],
      });
    },
  });
}
