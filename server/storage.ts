import {
  type Budget,
  type Category,
  type Transaction,
  type Module,
  type UserProgress,
  type ModuleFeedback,
  type Goal,
  type InsertBudget,
  type InsertCategory,
  type InsertTransaction,
  type InsertModule,
  type InsertUserProgress,
  type InsertModuleFeedback,
  type InsertGoal,
} from "@shared/schema";
import { supabase } from "./db";

// Import auth storage to merge
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";
import { chatStorage, type IChatStorage } from "./replit_integrations/chat/storage";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

type BudgetRow = {
  budget_id: number;
  user_id: number;
  monthly_limit: string | null;
  weekly_limit: string | null;
  date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function budgetFromRow(row: BudgetRow): Budget {
  return {
    id: row.budget_id,
    userId: row.user_id,
    monthlyLimit: row.monthly_limit,
    weeklyLimit: row.weekly_limit,
    date: toDate(row.date),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function budgetToRow(insertBudget: Partial<InsertBudget>) {
  return {
    user_id: insertBudget.userId,
    monthly_limit: insertBudget.monthlyLimit ?? undefined,
    weekly_limit: insertBudget.weeklyLimit ?? undefined,
    date: insertBudget.date ? (insertBudget.date as any).toISOString?.() ?? insertBudget.date : undefined,
    updated_at: new Date().toISOString(),
  };
}

type CategoryRow = {
  category_id: number;
  budget_id: number;
  label: string;
  allocated_amount?: string | number | null;
  color?: string | null;
  created_at: string | null;
};

function categoryFromRow(row: CategoryRow): Category {
  return {
    id: row.category_id,
    budgetId: row.budget_id,
    label: row.label,
    allocatedAmount:
      row.allocated_amount != null && row.allocated_amount !== ""
        ? String(row.allocated_amount)
        : "0",
    color: row.color && row.color.length > 0 ? row.color : "#64748b",
    createdAt: toDate(row.created_at),
  };
}

function categoryInsertRow(insert: InsertCategory) {
  return {
    budget_id: insert.budgetId,
    label: insert.label,
    allocated_amount: insert.allocatedAmount ?? "0",
    color: insert.color ?? "#64748b",
  };
}

function categoryPatchRow(updates: Partial<InsertCategory>) {
  const row: Record<string, unknown> = {};
  if (updates.budgetId !== undefined) row.budget_id = updates.budgetId;
  if (updates.label !== undefined) row.label = updates.label;
  if (updates.allocatedAmount !== undefined) row.allocated_amount = updates.allocatedAmount;
  if (updates.color !== undefined) row.color = updates.color;
  return row;
}

/** Default monthly total for new budgets (matches category seed sum). */
export const DEFAULT_BUDGET_MONTHLY = "2000";

/** Starter categories for new budget periods (sum = 2000). */
export const DEFAULT_BUDGET_CATEGORY_SEED: ReadonlyArray<{
  label: string;
  allocatedAmount: string;
  color: string;
}> = [
  { label: "Housing", allocatedAmount: "800", color: "#3b82f6" },
  { label: "Groceries", allocatedAmount: "400", color: "#22c55e" },
  { label: "Transportation", allocatedAmount: "300", color: "#eab308" },
  { label: "Utilities", allocatedAmount: "200", color: "#f59e0b" },
  { label: "Entertainment", allocatedAmount: "150", color: "#8b5cf6" },
  { label: "Savings", allocatedAmount: "150", color: "#06b6d4" },
];

type TransactionRow = {
  transaction_id: number;
  user_id: number;
  category_id: number | null;
  amount: string;
  date: string;
  description: string | null;
  created_at: string | null;
};

function transactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.transaction_id,
    userId: row.user_id,
    categoryId: row.category_id,
    amount: row.amount,
    date: toDate(row.date) ?? new Date(row.date),
    description: row.description,
    createdAt: toDate(row.created_at),
  };
}

function transactionToRow(insertTransaction: Partial<InsertTransaction>) {
  return {
    user_id: insertTransaction.userId,
    category_id: insertTransaction.categoryId ?? null,
    amount: insertTransaction.amount,
    date: insertTransaction.date
      ? (insertTransaction.date as any).toISOString?.() ?? insertTransaction.date
      : undefined,
    description: insertTransaction.description ?? null,
  };
}

type ModuleRow = {
  module_id: number;
  title: string;
  video_url: string | null;
  image_url: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function moduleFromRow(row: ModuleRow): Module {
  return {
    id: row.module_id,
    title: row.title,
    videoUrl: row.video_url,
    imageUrl: row.image_url,
    description: row.description,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function moduleToRow(insertModule: Partial<InsertModule>) {
  return {
    title: insertModule.title,
    video_url: insertModule.videoUrl ?? null,
    image_url: insertModule.imageUrl ?? null,
    description: insertModule.description ?? null,
    updated_at: new Date().toISOString(),
  };
}

type ModuleFeedbackRow = {
  feedback_id: number;
  user_id: number;
  module_id: number;
  rating: number;
  comment: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function moduleFeedbackFromRow(row: ModuleFeedbackRow): ModuleFeedback {
  return {
    id: row.feedback_id,
    userId: row.user_id,
    moduleId: row.module_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

type GoalRow = {
  goal_id: number;
  user_id: number;
  kind: string;
  preset_id: string | null;
  title: string;
  description: string | null;
  category_label: string | null;
  category_id: string | null;
  target_amount: string;
  saved_amount: string;
  unit: string;
  deadline: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function goalFromRow(row: GoalRow): Goal {
  return {
    id: row.goal_id,
    userId: row.user_id,
    kind: row.kind,
    presetId: row.preset_id,
    title: row.title,
    description: row.description,
    categoryLabel: row.category_label,
    categoryId: row.category_id,
    targetAmount: row.target_amount,
    savedAmount: row.saved_amount,
    unit: row.unit,
    deadline: toDate(row.deadline),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

type UserProgressRow = {
  progress_id: number;
  user_id: number;
  module_id: number;
  status: boolean;
  watch_later: boolean;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function userProgressFromRow(row: UserProgressRow): UserProgress {
  return {
    id: row.progress_id,
    userId: row.user_id,
    moduleId: row.module_id,
    status: row.status,
    watchLater: row.watch_later,
    completedAt: toDate(row.completed_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function userProgressToRow(insertProgress: Partial<InsertUserProgress>) {
  return {
    user_id: insertProgress.userId,
    module_id: insertProgress.moduleId,
    status: insertProgress.status,
    watch_later: insertProgress.watchLater,
    completed_at: insertProgress.completedAt
      ? (insertProgress.completedAt as any).toISOString?.() ?? insertProgress.completedAt
      : insertProgress.completedAt === null
        ? null
        : undefined,
    updated_at: new Date().toISOString(),
  };
}

export interface IStorage extends IAuthStorage, IChatStorage {
  // Budget
  getUserBudget(userId: number): Promise<Budget | undefined>;
  listUserBudgets(userId: number): Promise<Budget[]>;
  getBudgetByIdForUser(budgetId: number, userId: number): Promise<Budget | undefined>;
  ensureUserBudget(userId: number): Promise<Budget>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(budgetId: number, updates: Partial<InsertBudget>): Promise<Budget>;
  deleteBudgetForUser(budgetId: number, userId: number): Promise<void>;
  seedDefaultBudgetCategories(budgetId: number): Promise<void>;

  // Categories
  getCategories(budgetId: number): Promise<Category[]>;
  getCategoryById(categoryId: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(categoryId: number, updates: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(categoryId: number): Promise<void>;
  
  // Transactions
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Modules
  getModules(): Promise<Module[]>;
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  createModuleFeedback(input: InsertModuleFeedback): Promise<ModuleFeedback>;

  // Goals
  getGoalsByUser(userId: number): Promise<Goal[]>;
  createGoal(userId: number, data: InsertGoal): Promise<Goal>;
  updateGoal(goalId: number, userId: number, updates: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(goalId: number, userId: number): Promise<void>;
  getUserModuleProgressMap(userId: number): Promise<Record<number, { watched: boolean; watchLater: boolean }>>;
  getUserModuleProgress(userId: number): Promise<UserProgress[]>;
  getUserModuleProgressEntry(userId: number, moduleId: number): Promise<UserProgress | undefined>;
  upsertUserModuleProgress(
    userId: number,
    moduleId: number,
    patch: { watched?: boolean; watchLater?: boolean }
  ): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Inherit Auth Storage methods
  getUser = authStorage.getUser.bind(authStorage);
  getUserByEmail = authStorage.getUserByEmail.bind(authStorage);
  upsertUser = authStorage.upsertUser.bind(authStorage);
  updateUser = authStorage.updateUser.bind(authStorage);
  
  // Inherit Chat Storage methods
  getConversation = chatStorage.getConversation.bind(chatStorage);
  getAllConversations = chatStorage.getAllConversations.bind(chatStorage);
  createConversation = chatStorage.createConversation.bind(chatStorage);
  deleteConversation = chatStorage.deleteConversation.bind(chatStorage);
  getMessagesByConversation = chatStorage.getMessagesByConversation.bind(chatStorage);
  createMessage = chatStorage.createMessage.bind(chatStorage);

  // === App Implementation ===

  async getUserBudget(userId: number): Promise<Budget | undefined> {
    const { data, error } = await supabase
      .from("budget")
      .select("*")
      .eq("user_id", userId)
      .order("budget_id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? budgetFromRow(data as BudgetRow) : undefined;
  }

  async listUserBudgets(userId: number): Promise<Budget[]> {
    const { data, error } = await supabase
      .from("budget")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false, nullsFirst: false })
      .order("budget_id", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => budgetFromRow(r as BudgetRow));
  }

  async getBudgetByIdForUser(budgetId: number, userId: number): Promise<Budget | undefined> {
    const { data, error } = await supabase
      .from("budget")
      .select("*")
      .eq("budget_id", budgetId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? budgetFromRow(data as BudgetRow) : undefined;
  }

  async ensureUserBudget(userId: number): Promise<Budget> {
    const existing = await this.getUserBudget(userId);
    if (existing) return existing;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const budget = await this.createBudget({
      userId,
      monthlyLimit: DEFAULT_BUDGET_MONTHLY,
      weeklyLimit: "0",
      date: periodStart,
    } as InsertBudget);
    await this.seedDefaultBudgetCategories(budget.id);
    return budget;
  }

  async seedDefaultBudgetCategories(budgetId: number): Promise<void> {
    for (const row of DEFAULT_BUDGET_CATEGORY_SEED) {
      await this.createCategory({
        budgetId,
        label: row.label,
        allocatedAmount: row.allocatedAmount,
        color: row.color,
      });
    }
  }

  async deleteBudgetForUser(budgetId: number, userId: number): Promise<void> {
    const { data, error } = await supabase
      .from("budget")
      .delete()
      .eq("budget_id", budgetId)
      .eq("user_id", userId)
      .select("budget_id");
    if (error) throw error;
    if (!data?.length) throw new Error("Budget not found");
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const { data, error } = await supabase
      .from("budget")
      .insert(budgetToRow(insertBudget))
      .select("*")
      .single();
    if (error) throw error;
    return budgetFromRow(data as BudgetRow);
  }

  async getCategories(budgetId: number): Promise<Category[]> {
    const { data, error } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("budget_id", budgetId)
      .order("category_id", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => categoryFromRow(r as CategoryRow));
  }

  async getCategoryById(categoryId: number): Promise<Category | undefined> {
    const { data, error } = await supabase
      .from("budget_categories")
      .select("*")
      .eq("category_id", categoryId)
      .maybeSingle();
    if (error) throw error;
    return data ? categoryFromRow(data as CategoryRow) : undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const { data, error } = await supabase
      .from("budget_categories")
      .insert(categoryInsertRow(insertCategory))
      .select("*")
      .single();
    if (error) throw error;
    return categoryFromRow(data as CategoryRow);
  }

  async updateCategory(categoryId: number, updates: Partial<InsertCategory>): Promise<Category> {
    const patch = categoryPatchRow(updates);
    if (Object.keys(patch).length === 0) {
      throw new Error("No category fields to update");
    }
    const { data, error } = await supabase
      .from("budget_categories")
      .update(patch)
      .eq("category_id", categoryId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Category not found");
    return categoryFromRow(data as CategoryRow);
  }

  async deleteCategory(categoryId: number): Promise<void> {
    const { error } = await supabase.from("budget_categories").delete().eq("category_id", categoryId);
    if (error) throw error;
  }

  async updateBudget(budgetId: number, updates: Partial<InsertBudget>): Promise<Budget> {
    const { data, error } = await supabase
      .from("budget")
      .update(budgetToRow(updates))
      .eq("budget_id", budgetId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Budget not found");
    return budgetFromRow(data as BudgetRow);
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => transactionFromRow(r as TransactionRow));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const { data, error } = await supabase
      .from("transactions")
      .insert(transactionToRow(insertTransaction))
      .select("*")
      .single();
    if (error) throw error;
    return transactionFromRow(data as TransactionRow);
  }

  async getModules(): Promise<Module[]> {
    const { data, error } = await supabase.from("modules").select("*").order("module_id", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => moduleFromRow(r as ModuleRow));
  }

  async getModule(id: number): Promise<Module | undefined> {
    const { data, error } = await supabase.from("modules").select("*").eq("module_id", id).maybeSingle();
    if (error) throw error;
    return data ? moduleFromRow(data as ModuleRow) : undefined;
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const { data, error } = await supabase.from("modules").insert(moduleToRow(insertModule)).select("*").single();
    if (error) throw error;
    return moduleFromRow(data as ModuleRow);
  }

  async createModuleFeedback(input: InsertModuleFeedback): Promise<ModuleFeedback> {
    const { data, error } = await supabase
      .from("module_feedback")
      .insert({
        user_id: input.userId,
        module_id: input.moduleId,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return moduleFeedbackFromRow(data as ModuleFeedbackRow);
  }

  async getGoalsByUser(userId: number): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("goal_id", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => goalFromRow(r as GoalRow));
  }

  async createGoal(userId: number, input: InsertGoal): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        kind: input.kind ?? "custom",
        preset_id: input.presetId ?? null,
        title: input.title,
        description: input.description ?? null,
        category_label: input.categoryLabel ?? null,
        category_id: input.categoryId ?? null,
        target_amount: String(input.targetAmount ?? 0),
        saved_amount: String(input.savedAmount ?? 0),
        unit: input.unit ?? "usd",
        deadline: input.deadline
          ? (input.deadline instanceof Date ? input.deadline : new Date(String(input.deadline))).toISOString()
          : null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return goalFromRow(data as GoalRow);
  }

  async updateGoal(goalId: number, userId: number, updates: Partial<InsertGoal>): Promise<Goal> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description ?? null;
    if (updates.categoryLabel !== undefined) row.category_label = updates.categoryLabel ?? null;
    if (updates.categoryId !== undefined) row.category_id = updates.categoryId ?? null;
    if (updates.targetAmount !== undefined) row.target_amount = String(updates.targetAmount ?? 0);
    if (updates.savedAmount !== undefined) row.saved_amount = String(updates.savedAmount ?? 0);
    if (updates.unit !== undefined) row.unit = updates.unit;
    if (updates.deadline !== undefined) {
      row.deadline = updates.deadline === null
        ? null
        : (updates.deadline instanceof Date ? updates.deadline : new Date(String(updates.deadline))).toISOString();
    }

    const { data, error } = await supabase
      .from("goals")
      .update(row)
      .eq("goal_id", goalId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Goal not found");
    return goalFromRow(data as GoalRow);
  }

  async deleteGoal(goalId: number, userId: number): Promise<void> {
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("goal_id", goalId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async getUserModuleProgress(userId: number): Promise<UserProgress[]> {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => userProgressFromRow(row as UserProgressRow));
  }

  async getUserModuleProgressEntry(userId: number, moduleId: number): Promise<UserProgress | undefined> {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .maybeSingle();
    if (error) throw error;
    return data ? userProgressFromRow(data as UserProgressRow) : undefined;
  }

  async getUserModuleProgressMap(userId: number): Promise<Record<number, { watched: boolean; watchLater: boolean }>> {
    const progress = await this.getUserModuleProgress(userId);
    return progress.reduce<Record<number, { watched: boolean; watchLater: boolean }>>((map, entry) => {
      map[entry.moduleId] = {
        watched: entry.status,
        watchLater: entry.watchLater,
      };
      return map;
    }, {});
  }

  async upsertUserModuleProgress(
    userId: number,
    moduleId: number,
    patch: { watched?: boolean; watchLater?: boolean }
  ): Promise<void> {
    const existing = await this.getUserModuleProgressEntry(userId, moduleId);
    const watched = patch.watched ?? existing?.status ?? false;
    const watchLater = patch.watchLater ?? existing?.watchLater ?? false;

    if (!watched && !watchLater) {
      const { error: deleteError } = await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", userId)
        .eq("module_id", moduleId);
      if (deleteError) throw deleteError;
      return;
    }

    const completedAt = watched ? existing?.completedAt ?? new Date() : null;
    const { error } = await supabase
      .from("user_progress")
      .upsert(
        userProgressToRow({
          userId,
          moduleId,
          status: watched,
          watchLater,
          completedAt,
        }),
        {
          onConflict: "user_id,module_id",
        }
      );
    if (error) throw error;
  }
}

export const storage = new DatabaseStorage();
