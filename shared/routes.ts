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
          keepLearning: z.array(z.custom<typeof modules.$inferSelect>()),
          suggested: z.array(z.custom<typeof modules.$inferSelect>()),
          popular: z.array(z.custom<typeof modules.$inferSelect>()),
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
