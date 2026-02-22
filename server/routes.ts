import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";

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
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const budget = await storage.getUserBudget(userId);
    let budgetWithCategories = null;
    
    if (budget) {
      const categories = await storage.getCategories(budget.id);
      budgetWithCategories = { ...budget, categories };
    }

    const recentTransactions = await storage.getTransactions(userId);
    const allModules = await storage.getModules();

    res.json({
      budget: budgetWithCategories,
      recentTransactions: recentTransactions.slice(0, 5), // Limit to 5
      modules: {
        recent: allModules.filter(m => m.category === 'Recent'),
        recommended: allModules.filter(m => m.category === 'Recommended'),
      }
    });
  });

  app.get(api.modules.list.path, async (req, res) => {
    const allModules = await storage.getModules();
    res.json({
      keepLearning: allModules.filter(m => m.category === 'Recent'), // Reusing recent as keep learning
      suggested: allModules.filter(m => m.category === 'Suggested' || m.category === 'Recommended'),
      popular: allModules.filter(m => m.category === 'Popular'),
      all: allModules, // Include all modules
    });
  });

  app.get(api.modules.get.path, async (req, res) => {
    const moduleId = parseInt(req.params.id, 10);
    if (isNaN(moduleId)) {
      return res.status(400).json({ message: "Invalid module ID" });
    }

    const module = await storage.getModule(moduleId);
    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    res.json(module);
  });

  app.get(api.budget.get.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const budget = await storage.getUserBudget(userId);

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const categories = await storage.getCategories(budget.id);
    res.json({ ...budget, categories });
  });

  // Update budget
  app.put(api.budget.get.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const budget = await storage.getUserBudget(userId);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const { totalAmount, period } = req.body;
    const updatedBudget = await storage.updateBudget(budget.id, {
      totalAmount: totalAmount ? String(totalAmount) : undefined,
      period: period || undefined,
    });

    const categories = await storage.getCategories(updatedBudget.id);
    res.json({ ...updatedBudget, categories });
  });

  // Create category
  app.post("/api/budget/categories", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const budget = await storage.getUserBudget(userId);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const { name, allocatedAmount, color } = req.body;
    if (!name || !allocatedAmount || !color) {
      return res.status(400).json({ message: "Name, allocatedAmount, and color are required" });
    }

    const category = await storage.createCategory({
      budgetId: budget.id,
      name,
      allocatedAmount: String(allocatedAmount),
      color,
    });

    res.json(category);
  });

  // Update category
  app.put("/api/budget/categories/:id", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const categoryId = parseInt(req.params.id, 10);
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

    const { name, allocatedAmount, color } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (allocatedAmount !== undefined) updates.allocatedAmount = String(allocatedAmount);
    if (color !== undefined) updates.color = color;

    const updatedCategory = await storage.updateCategory(categoryId, updates);
    res.json(updatedCategory);
  });

  // Delete category
  app.delete("/api/budget/categories/:id", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const categoryId = parseInt(req.params.id, 10);
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
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const transactions = await storage.getTransactions(userId);
    res.json(transactions);
  });

  // Seed Data Endpoint (for development convenience)
  app.post("/api/seed", async (req, res) => {
    await seedDatabase();
    res.json({ message: "Database seeded" });
  });

  // Auto-seed on startup if empty
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  // Check if modules exist (they're shared, not user-specific)
  const existingModules = await storage.getModules();
  if (existingModules.length === 0) {
    console.log("Seeding database with modules...");
    
    // Create Modules with images
    const moduleCategories = ["Recent", "Recommended", "Suggested", "Popular"];
    for (const cat of moduleCategories) {
      for (let i = 1; i <= 3; i++) {
        await storage.createModule({
          title: `${cat} Module ${i}`,
          description: "Learn about financial literacy in this exciting module.",
          category: cat,
          videoUrl: "#",
          imageUrl: `/images/module_thumb_${i}.jpg`
        });
      }
    }
    
    console.log("Database seeded successfully.");
  }
}
