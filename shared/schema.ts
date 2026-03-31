import { pgTable, text, serial, integer, timestamp, numeric, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth model
export * from "./models/auth";

// Import for relations
import { users } from "./models/auth";

// === APP SPECIFIC TABLES ===

export const budgets = pgTable("budget", {
  id: serial("budget_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  monthlyLimit: numeric("monthly_limit", { precision: 10, scale: 2 }),
  weeklyLimit: numeric("weekly_limit", { precision: 10, scale: 2 }),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("budget_categories", {
  id: serial("category_id").primaryKey(),
  budgetId: integer("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }).notNull(),
  allocatedAmount: numeric("allocated_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  color: varchar("color", { length: 32 }).default("#64748b").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("transaction_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const modules = pgTable("modules", {
  id: serial("module_id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  imageUrl: varchar("image_url", { length: 500 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("progress_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  status: boolean("status").default(false).notNull(),
  watchLater: boolean("watch_later").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("goal_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 10 }).notNull().default("custom"),
  presetId: varchar("preset_id", { length: 100 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  categoryLabel: varchar("category_label", { length: 100 }),
  categoryId: varchar("category_id", { length: 50 }),
  targetAmount: numeric("target_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  savedAmount: numeric("saved_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: varchar("unit", { length: 10 }).notNull().default("usd"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });

// === TYPES ===

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

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
  suggested: Module[];
  popular: Module[];
};
