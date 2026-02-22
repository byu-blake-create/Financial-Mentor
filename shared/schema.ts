import { pgTable, text, serial, integer, boolean, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth and Chat models from blueprints
export * from "./models/auth";
export * from "./models/chat";

// Import for relations
import { users } from "./models/auth";

// === APP SPECIFIC TABLES ===

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Links to users.id from auth
  totalAmount: numeric("total_amount").notNull(),
  period: text("period").notNull(), // e.g., "January 2025"
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull(),
  name: text("name").notNull(), // Rent, Gas, etc.
  allocatedAmount: numeric("allocated_amount").notNull(),
  color: text("color").notNull(), // Hex code for UI
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  categoryId: integer("category_id"), // Optional link to category
});

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url"), // Placeholder URL
  category: text("category").notNull(), // Recent, Recommended, Popular
  imageUrl: text("image_url"), // For thumbnail
});

// === RELATIONS ===

export const budgetsRelations = relations(budgets, ({ many }) => ({
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one }) => ({
  budget: one(budgets, {
    fields: [categories.budgetId],
    references: [budgets.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true });

// === TYPES ===

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

// === API TYPES ===

export type DashboardDataResponse = {
  budget: Budget & { categories: Category[] } | null;
  recentTransactions: Transaction[];
  modules: {
    recent: Module[];
    recommended: Module[];
  };
};

export type ModulesResponse = {
  keepLearning: Module[];
  suggested: Module[];
  popular: Module[];
};
