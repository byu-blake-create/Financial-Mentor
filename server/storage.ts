import { 
  budgets, categories, transactions, modules, 
  type Budget, type Category, type Transaction, type Module,
  type InsertBudget, type InsertCategory, type InsertTransaction, type InsertModule
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Import auth storage to merge
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";
import { chatStorage, type IChatStorage } from "./replit_integrations/chat/storage";

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
    const [budget] = await db.select().from(budgets).where(eq(budgets.userId, userId));
    return budget;
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const [budget] = await db.insert(budgets).values(insertBudget).returning();
    return budget;
  }

  async getCategories(budgetId: number): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.budgetId, budgetId));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(categoryId: number, updates: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, categoryId))
      .returning();
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  }

  async deleteCategory(categoryId: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, categoryId));
  }

  async updateBudget(budgetId: number, updates: Partial<InsertBudget>): Promise<Budget> {
    const [budget] = await db
      .update(budgets)
      .set(updates)
      .where(eq(budgets.id, budgetId))
      .returning();
    if (!budget) {
      throw new Error("Budget not found");
    }
    return budget;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getModules(): Promise<Module[]> {
    return db.select().from(modules);
  }

  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const [module] = await db.insert(modules).values(insertModule).returning();
    return module;
  }
}

export const storage = new DatabaseStorage();
