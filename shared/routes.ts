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

export const api = {
  dashboard: {
    get: {
      method: 'GET' as const,
      path: '/api/dashboard' as const,
      responses: {
        200: z.object({
          budget: z.custom<typeof budgets.$inferSelect & { categories: typeof categories.$inferSelect[] }>().nullable(),
          recentTransactions: z.array(z.custom<typeof transactions.$inferSelect>()),
          modules: z.object({
            recent: z.array(z.custom<typeof modules.$inferSelect>()),
            recommended: z.array(z.custom<typeof modules.$inferSelect>()),
          })
        }),
      },
    },
  },
  modules: {
    list: {
      method: 'GET' as const,
      path: '/api/modules' as const,
      responses: {
        200: z.object({
          suggested: z.array(z.custom<typeof modules.$inferSelect & { watched?: boolean; watchLater?: boolean }>()),
          popular: z.array(z.custom<typeof modules.$inferSelect & { watched?: boolean; watchLater?: boolean }>()),
          all: z.array(z.custom<typeof modules.$inferSelect & { watched?: boolean; watchLater?: boolean }>()),
          watchLater: z.array(z.custom<typeof modules.$inferSelect & { watched?: boolean; watchLater?: boolean }>()),
          watched: z.array(z.custom<typeof modules.$inferSelect & { watched?: boolean; watchLater?: boolean }>()),
        }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/modules/:id' as const,
      responses: {
        200: z.custom<typeof modules.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
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
  },
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals' as const,
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
