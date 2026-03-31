import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";

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

function toClientModule(module: any, category: string) {
  return {
    ...module,
    category,
  };
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

  app.put("/api/auth/user", isAuthenticated, async (req: any, res) => {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const firstName = typeof req.body?.firstName === "string" ? req.body.firstName.trim() : undefined;
    const lastName = typeof req.body?.lastName === "string" ? req.body.lastName.trim() : undefined;
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : undefined;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    try {
      const updatedUser = await storage.updateUser(userId, {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      if (req.user) {
        req.user.email = updatedUser.email;
        req.user.firstName = updatedUser.firstName;
        req.user.lastName = updatedUser.lastName;
      }

      res.json(updatedUser);
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("unique")) {
        return res.status(400).json({ message: "That email address is already in use" });
      }
      throw error;
    }
  });

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
    const recentModules = allModules.slice(0, 4).map((m) => toClientModule(m, "Recent"));
    const recommendedModules = allModules.slice(4, 8).map((m) => toClientModule(m, "Recommended"));

    res.json({
      budget: budgetWithCategories,
      recentTransactions: recentTransactions.slice(0, 5), // Limit to 5
      modules: {
        recent: recentModules,
        recommended: recommendedModules,
      }
    });
  });

  app.get(api.modules.list.path, async (req, res) => {
    const allModules = await storage.getModules();
    const keepLearning = allModules.slice(0, 4).map((m) => toClientModule(m, "Keep Learning"));
    const suggested = allModules.slice(4, 8).map((m) => toClientModule(m, "Suggested"));
    const popular = allModules.slice(8, 12).map((m) => toClientModule(m, "Popular"));
    const all = allModules.map((m, idx) => toClientModule(m, idx % 2 === 0 ? "Suggested" : "Popular"));
    res.json({
      keepLearning,
      suggested,
      popular,
      all,
    });
  });

  app.get(api.modules.get.path, async (req, res) => {
    const moduleId = parseInt(String(req.params.id), 10);
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }

    const module = await storage.getModule(moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }
    res.json(toClientModule(module, "Suggested"));
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

  // Goals CRUD
  app.get(api.goals.list.path, isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const list = await storage.getGoalsByUser(userId);
      res.json(list);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to load goals" });
    }
  });

  app.post(api.goals.list.path, isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { kind, presetId, title, description, categoryLabel, categoryId, targetAmount, savedAmount, unit, deadline } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    try {
      const goal = await storage.createGoal(userId, {
        userId,
        kind: kind ?? "custom",
        presetId: presetId ?? null,
        title: title.trim(),
        description: description ?? null,
        categoryLabel: categoryLabel ?? null,
        categoryId: categoryId ?? null,
        targetAmount: targetAmount != null ? String(targetAmount) : "0",
        savedAmount: savedAmount != null ? String(savedAmount) : "0",
        unit: unit ?? "usd",
        deadline: deadline ? new Date(String(deadline)) : null,
      });
      res.status(201).json(goal);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  app.put("/api/goals/:id", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const goalId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(goalId)) return res.status(400).json({ message: "Invalid goal ID" });

    const updates: Record<string, unknown> = {};
    const { title, description, categoryLabel, categoryId, targetAmount, savedAmount, unit, deadline } = req.body;
    if (title !== undefined) updates.title = String(title).trim();
    if (description !== undefined) updates.description = description;
    if (categoryLabel !== undefined) updates.categoryLabel = categoryLabel;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (targetAmount !== undefined) updates.targetAmount = String(targetAmount);
    if (savedAmount !== undefined) updates.savedAmount = String(savedAmount);
    if (unit !== undefined) updates.unit = unit;
    if (deadline !== undefined) updates.deadline = deadline ? new Date(String(deadline)) : null;

    try {
      const goal = await storage.updateGoal(goalId, userId, updates as any);
      res.json(goal);
    } catch (e: any) {
      if (e?.message === "Goal not found") return res.status(404).json({ message: "Goal not found" });
      console.error(e);
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const goalId = parseInt(String(req.params.id), 10);
    if (Number.isNaN(goalId)) return res.status(400).json({ message: "Invalid goal ID" });
    try {
      await storage.deleteGoal(goalId, userId);
      res.json({ message: "Goal deleted" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  return httpServer;
}
