import {
  type Budget,
  type Category,
  type Transaction,
  type Module,
  type Goal,
  type InsertBudget,
  type InsertCategory,
  type InsertTransaction,
  type InsertModule,
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
  created_at: string | null;
};

function categoryFromRow(row: CategoryRow): Category {
  return {
    id: row.category_id,
    budgetId: row.budget_id,
    label: row.label,
    createdAt: toDate(row.created_at),
  };
}

function categoryToRow(insertCategory: Partial<InsertCategory>) {
  return {
    budget_id: insertCategory.budgetId,
    label: insertCategory.label,
  };
}

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

export interface IStorage extends IAuthStorage, IChatStorage {
  // Budget
  getUserBudget(userId: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(budgetId: number, updates: Partial<InsertBudget>): Promise<Budget>;
  
  // Categories
  getCategories(budgetId: number): Promise<Category[]>;
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

  // Goals
  getGoalsByUser(userId: number): Promise<Goal[]>;
  createGoal(userId: number, data: InsertGoal): Promise<Goal>;
  updateGoal(goalId: number, userId: number, updates: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(goalId: number, userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Inherit Auth Storage methods
  getUser = authStorage.getUser.bind(authStorage);
  getUserByEmail = authStorage.getUserByEmail.bind(authStorage);
  upsertUser = authStorage.upsertUser.bind(authStorage);
  
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

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const { data, error } = await supabase
      .from("budget_categories")
      .insert(categoryToRow(insertCategory))
      .select("*")
      .single();
    if (error) throw error;
    return categoryFromRow(data as CategoryRow);
  }

  async updateCategory(categoryId: number, updates: Partial<InsertCategory>): Promise<Category> {
    const { data, error } = await supabase
      .from("budget_categories")
      .update(categoryToRow(updates))
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
}

export const storage = new DatabaseStorage();
