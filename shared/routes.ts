import { z } from "zod";
import {
  budgets,
  categories,
import { z } from 'zod';
import { 
  insertBudgetSchema, 
  insertCategorySchema, 
  insertTransactionSchema, 
  insertModuleFeedbackSchema,
  budgets, 
  categories, 
  transactions, 
  modules,
  goals,
  modules,
  transactions,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const moduleResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  videoUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),
  category: z.string(),
  watched: z.boolean(),
  watchLater: z.boolean(),
  completedAt: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export const budgetCategoryResponseSchema = z.object({
  id: z.number(),
  budgetId: z.number(),
  name: z.string(),
  allocatedAmount: z.string(),
  color: z.string(),
});

export const budgetResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  totalAmount: z.string(),
  period: z.string(),
  categories: z.array(budgetCategoryResponseSchema),
});

export const modulesListResponseSchema = z.object({
  suggested: z.array(moduleResponseSchema),
  popular: z.array(moduleResponseSchema),
  all: z.array(moduleResponseSchema),
  watchLater: z.array(moduleResponseSchema),
  watched: z.array(moduleResponseSchema),
});

export const dashboardResponseSchema = z.object({
  budget: budgetResponseSchema.nullable(),
  recentTransactions: z.array(z.custom<typeof transactions.$inferSelect>()),
  modules: z.object({
    upNext: z.array(moduleResponseSchema),
    watchlist: z.array(moduleResponseSchema),
  }),
});

export const moduleProgressUpdateSchema = z
  .object({
    watched: z.boolean().optional(),
    watchLater: z.boolean().optional(),
  })
  .refine((value) => value.watched !== undefined || value.watchLater !== undefined, {
    message: "At least one progress field must be provided",
  });

export type ModuleResponse = z.infer<typeof moduleResponseSchema>;
export type ModulesListResponse = z.infer<typeof modulesListResponseSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
export type ModuleProgressUpdateRequest = z.infer<typeof moduleProgressUpdateSchema>;

export const api = {
  dashboard: {
    get: {
      method: "GET" as const,
      path: "/api/dashboard" as const,
      responses: {
        200: dashboardResponseSchema,
      },
    },
  },
  modules: {
    list: {
      method: "GET" as const,
      path: "/api/modules" as const,
      responses: {
        200: modulesListResponseSchema,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/modules/:id" as const,
      responses: {
        200: moduleResponseSchema,
        404: errorSchemas.notFound,
      },
    },
    progress: {
      method: "PATCH" as const,
      path: "/api/modules/:id/progress" as const,
      body: moduleProgressUpdateSchema,
      responses: {
        200: moduleResponseSchema,
    feedback: {
      method: 'POST' as const,
      path: '/api/modules/:id/feedback' as const,
      body: insertModuleFeedbackSchema.pick({ rating: true, comment: true }),
      responses: {
        201: z.object({
          id: z.number(),
          userId: z.number(),
          moduleId: z.number(),
          rating: z.number(),
          comment: z.string().nullable(),
          createdAt: z.date().nullable(),
          updatedAt: z.date().nullable(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.notFound,
        404: errorSchemas.notFound,
      },
    },
    }
  },
  budget: {
    get: {
      method: "GET" as const,
      path: "/api/budget" as const,
      responses: {
        200: budgetResponseSchema,
        404: errorSchemas.notFound,
      },
    },
  },
  transactions: {
    list: {
      method: "GET" as const,
      path: "/api/transactions" as const,
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      },
    },
  },
  goals: {
    list: {
      method: "GET" as const,
      path: "/api/goals" as const,
      responses: {
        200: z.array(z.custom<typeof goals.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
