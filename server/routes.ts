import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, moduleProgressUpdateSchema } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import type { Module, UserProgress } from "@shared/schema";

function getCurrentUserId(req: any): number | null {
  const id = Number(req.user?.id);
  return Number.isFinite(id) ? id : null;
}

function toClientCategory(category: any) {
  return {
    ...category,
    name: category.label,
    allocatedAmount: "0",
    color: "#64748b",
  };
}

function toClientBudget(budget: any, categories: any[]) {
  return {
    ...budget,
    totalAmount: budget.monthlyLimit ?? "0",
    period: budget.date ? new Date(budget.date).toISOString().slice(0, 10) : "",
    categories: categories.map(toClientCategory),
  };
}

function toClientModule(module: Module, category: string, progress?: UserProgress) {
  return {
    id: module.id,
    title: module.title,
    description: module.description ?? "",
    videoUrl: module.videoUrl,
    imageUrl: module.imageUrl,
    category,
    watched: progress?.status ?? false,
    watchLater: progress?.watchLater ?? false,
    completedAt: progress?.completedAt ? progress.completedAt.toISOString() : null,
    createdAt: module.createdAt ? module.createdAt.toISOString() : null,
    updatedAt: module.updatedAt ? module.updatedAt.toISOString() : null,
  };
}

function buildProgressMap(progressRows: UserProgress[]) {
  return new Map(progressRows.map((entry) => [entry.moduleId, entry]));
}

function getUnwatchedModules(allModules: Module[], progressMap: Map<number, UserProgress>) {
  const watchlist = allModules.filter((module) => {
    const progress = progressMap.get(module.id);
    return Boolean(progress?.watchLater) && !Boolean(progress?.status);
  });

  const remaining = allModules.filter((module) => {
    const progress = progressMap.get(module.id);
    return !progress?.status && !progress?.watchLater;
  });

  return [...watchlist, ...remaining];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Setup Chat
  registerChatRoutes(app);

  // === APP ROUTES ===

  // === APP ROUTES ===
  // All routes require authentication

  app.get(api.dashboard.get.path, isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const budget = await storage.getUserBudget(userId);
    let budgetWithCategories = null;
    
    if (budget) {
      const categories = await storage.getCategories(budget.id);
      budgetWithCategories = toClientBudget(budget, categories);
    }

    const recentTransactions = await storage.getTransactions(userId);
    const allModules = await storage.getModules();
    const progressMap = buildProgressMap(await storage.getUserModuleProgress(userId));
    const upNextModules = getUnwatchedModules(allModules, progressMap)
      .slice(0, 4)
      .map((module) =>
        toClientModule(
          module,
          progressMap.get(module.id)?.watchLater ? "Watchlist" : "Up Next",
          progressMap.get(module.id)
        )
      );
    const watchlistModules = allModules
      .filter((module) => {
        const progress = progressMap.get(module.id);
        return Boolean(progress?.watchLater) && !Boolean(progress?.status);
      })
      .slice(0, 4)
      .map((module) => toClientModule(module, "Watchlist", progressMap.get(module.id)));

    res.json({
      budget: budgetWithCategories,
      recentTransactions: recentTransactions.slice(0, 5), // Limit to 5
      modules: {
        upNext: upNextModules,
        watchlist: watchlistModules,
      }
    });
  });

  app.get(api.modules.list.path, async (req, res) => {
    const userId = getCurrentUserId(req);
    const allModules = await storage.getModules();
    const progressMap = userId ? buildProgressMap(await storage.getUserModuleProgress(userId)) : new Map<number, UserProgress>();
    const keepLearning = getUnwatchedModules(allModules, progressMap)
      .slice(0, 4)
      .map((module) =>
        toClientModule(
          module,
          progressMap.get(module.id)?.watchLater ? "Watchlist" : "Up Next",
          progressMap.get(module.id)
        )
      );
    const suggested = allModules
      .slice(4, 8)
      .map((module) => toClientModule(module, "Suggested", progressMap.get(module.id)));
    const popular = allModules
      .slice(8, 12)
      .map((module) => toClientModule(module, "Popular", progressMap.get(module.id)));
    const all = allModules.map((module, idx) =>
      toClientModule(module, idx % 2 === 0 ? "Suggested" : "Popular", progressMap.get(module.id))
    );
    res.json({
      keepLearning,
      suggested,
      popular,
      all,
    });
  });

  app.get(api.modules.get.path, async (req, res) => {
    const userId = getCurrentUserId(req);
    const moduleId = parseInt(String(req.params.id), 10);
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }

    const module = await storage.getModule(moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const progress = userId ? await storage.getUserModuleProgressEntry(userId, moduleId) : undefined;
    res.json(toClientModule(module, "Module", progress));
  });

  app.patch(api.modules.progress.path, isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const moduleId = parseInt(String(req.params.id), 10);
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }

    const parsedBody = moduleProgressUpdateSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: parsedBody.error.issues[0]?.message ?? "Invalid progress update",
        field: parsedBody.error.issues[0]?.path[0],
      });
    }

    const module = await storage.getModule(moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const progress = await storage.upsertUserModuleProgress(userId, moduleId, parsedBody.data);
    res.json(toClientModule(module, "Module", progress));
  });

  app.get(api.budget.get.path, isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const budget = await storage.getUserBudget(userId);

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const categories = await storage.getCategories(budget.id);
    res.json(toClientBudget(budget, categories));
  });

  // Update budget
  app.put(api.budget.get.path, isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const budget = await storage.getUserBudget(userId);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const { totalAmount, period } = req.body;
    const parsedDate = period ? new Date(period) : null;
    const updatedBudget = await storage.updateBudget(budget.id, {
      monthlyLimit: totalAmount ? String(totalAmount) : undefined,
      date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined,
    });

    const categories = await storage.getCategories(updatedBudget.id);
    res.json(toClientBudget(updatedBudget, categories));
  });

  // Create category
  app.post("/api/budget/categories", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const budget = await storage.getUserBudget(userId);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const category = await storage.createCategory({
      budgetId: budget.id,
      label: String(name),
    });

    res.json(toClientCategory(category));
  });

  // Update category
  app.put("/api/budget/categories/:id", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const categoryId = parseInt(String(req.params.id), 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const budget = await storage.getUserBudget(userId);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Verify category belongs to user's budget
    const categories = await storage.getCategories(budget.id);
    if (!categories.find(c => c.id === categoryId)) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { name } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.label = String(name);

    const updatedCategory = await storage.updateCategory(categoryId, updates);
    res.json(toClientCategory(updatedCategory));
  });

  // Delete category
  app.delete("/api/budget/categories/:id", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const categoryId = parseInt(String(req.params.id), 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const budget = await storage.getUserBudget(userId);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // Verify category belongs to user's budget
    const categories = await storage.getCategories(budget.id);
    if (!categories.find(c => c.id === categoryId)) {
      return res.status(404).json({ message: "Category not found" });
    }

    await storage.deleteCategory(categoryId);
    res.json({ message: "Category deleted successfully" });
  });

  app.get(api.transactions.list.path, isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const transactions = await storage.getTransactions(userId);
    res.json(transactions);
  });

  return httpServer;
}
