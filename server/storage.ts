import {
  type Budget,
  type Category,
  type Transaction,
  type Module,
  type InsertBudget,
  type InsertCategory,
  type InsertTransaction,
  type InsertModule,
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

  getUserModuleProgressMap(userId: number): Promise<Record<number, { watched: boolean; watchLater: boolean }>>;
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

  async getUserModuleProgressMap(userId: number): Promise<Record<number, { watched: boolean; watchLater: boolean }>> {
    const { data, error } = await supabase
      .from("user_progress")
      .select("module_id,status,watch_later")
      .eq("user_id", userId);
    if (error) throw error;
    const map: Record<number, { watched: boolean; watchLater: boolean }> = {};
    for (const row of data ?? []) {
      const r = row as { module_id: number; status: boolean | null; watch_later?: boolean | null };
      map[r.module_id] = {
        watched: !!r.status,
        watchLater: !!r.watch_later,
      };
    }
    return map;
  }

  async upsertUserModuleProgress(
    userId: number,
    moduleId: number,
    patch: { watched?: boolean; watchLater?: boolean }
  ): Promise<void> {
    const { data: existing, error: selErr } = await supabase
      .from("user_progress")
      .select("status,watch_later")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .maybeSingle();
    if (selErr) throw selErr;

    const ex = existing as { status: boolean | null; watch_later?: boolean | null } | null;
    const watched = patch.watched !== undefined ? patch.watched : !!ex?.status;
    const watchLater = patch.watchLater !== undefined ? patch.watchLater : !!ex?.watch_later;

    if (!watched && !watchLater) {
      const { error: delErr } = await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", userId)
        .eq("module_id", moduleId);
      if (delErr) throw delErr;
      return;
    }

    const row = {
      user_id: userId,
      module_id: moduleId,
      status: watched,
      watch_later: watchLater,
      completed_at: watched ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("user_progress").upsert(row, {
      onConflict: "user_id,module_id",
    });
    if (error) throw error;
  }
}

export const storage = new DatabaseStorage();
