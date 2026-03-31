import { z } from 'zod';
import { 
  insertBudgetSchema, 
  insertCategorySchema, 
  insertTransactionSchema, 
  budgets, 
  categories, 
  transactions, 
  modules 
} from './schema';

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

export const modulesListResponseSchema = z.object({
  keepLearning: z.array(moduleResponseSchema),
  suggested: z.array(moduleResponseSchema),
  popular: z.array(moduleResponseSchema),
  all: z.array(moduleResponseSchema),
});

export const dashboardResponseSchema = z.object({
  budget: z.custom<typeof budgets.$inferSelect & { categories: typeof categories.$inferSelect[] }>().nullable(),
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
      method: 'GET' as const,
      path: '/api/dashboard' as const,
      responses: {
        200: dashboardResponseSchema,
      },
    },
  },
  modules: {
    list: {
      method: 'GET' as const,
      path: '/api/modules' as const,
      responses: {
        200: modulesListResponseSchema,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/modules/:id' as const,
      responses: {
        200: moduleResponseSchema,
        404: errorSchemas.notFound,
      },
    },
    progress: {
      method: 'PATCH' as const,
      path: '/api/modules/:id/progress' as const,
      body: moduleProgressUpdateSchema,
      responses: {
        200: moduleResponseSchema,
        400: errorSchemas.validation,
        401: errorSchemas.notFound,
        404: errorSchemas.notFound,
      },
    }
  },
  budget: {
    get: {
      method: 'GET' as const,
      path: '/api/budget' as const,
      responses: {
        200: z.custom<typeof budgets.$inferSelect & { categories: typeof categories.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      }
    }
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions' as const,
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      }
    }
  }
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
