import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
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

  // Middleware to get current user ID (mock for now if not logged in, or use auth)
  // For prototype simplicity, we might default to a test user if not logged in, 
  // or require login. Let's assume we use the first user or a demo user for data fetching 
  // if no auth, to make the prototype viewable immediately? 
  // Actually, better to stick to the auth flow or create a seed user.
  // Let's use a "demo-user-id" for the public prototype views if not logged in, 
  // or just protect them. Given the prompt is a prototype, I'll allow access but 
  // maybe map to a default user for the data.

  const DEMO_USER_ID = "demo-user-123";

  app.get(api.dashboard.get.path, async (req, res) => {
    // In a real app: const userId = req.user?.id;
    const userId = (req.user as any)?.claims?.sub || DEMO_USER_ID;

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
      suggested: allModules.filter(m => m.category === 'Suggested'),
      popular: allModules.filter(m => m.category === 'Popular'),
    });
  });

  app.get(api.budget.get.path, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub || DEMO_USER_ID;
    const budget = await storage.getUserBudget(userId);
    
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const categories = await storage.getCategories(budget.id);
    res.json({ ...budget, categories });
  });

  app.get(api.transactions.list.path, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub || DEMO_USER_ID;
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
  const DEMO_USER_ID = "demo-user-123";
  
  // Check if budget exists
  const existingBudget = await storage.getUserBudget(DEMO_USER_ID);
  if (!existingBudget) {
    console.log("Seeding database...");
    
    // Create Budget
    const budget = await storage.createBudget({
      userId: DEMO_USER_ID,
      totalAmount: "2000",
      period: "February 2026"
    });

    // Create Categories from PDF data
    await storage.createCategory({ budgetId: budget.id, name: "Rent", allocatedAmount: "900", color: "#3b82f6" }); // 45%
    await storage.createCategory({ budgetId: budget.id, name: "Gas", allocatedAmount: "300", color: "#eab308" }); // 15%
    await storage.createCategory({ budgetId: budget.id, name: "Bills", allocatedAmount: "500", color: "#ef4444" }); // 25%
    await storage.createCategory({ budgetId: budget.id, name: "Savings", allocatedAmount: "300", color: "#22c55e" }); // 15%

    // Create Transactions from PDF data
    await storage.createTransaction({ userId: DEMO_USER_ID, amount: "4.68", description: "Swig", date: "2025-01-18" });
    await storage.createTransaction({ userId: DEMO_USER_ID, amount: "8.24", description: "Taco Bell", date: "2025-01-17" });
    await storage.createTransaction({ userId: DEMO_USER_ID, amount: "4.68", description: "Swig", date: "2025-01-16" });
    await storage.createTransaction({ userId: DEMO_USER_ID, amount: "12.34", description: "In n Out", date: "2025-01-15" });

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
