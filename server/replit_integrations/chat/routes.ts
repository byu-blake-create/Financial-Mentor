import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { isAuthenticated } from "../auth";

// Lazy initialization of OpenAI client
function getOpenAIClient(): OpenAI {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openAIApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const apiKey = geminiApiKey || openAIApiKey;

  if (!apiKey) {
    throw new Error(
      "AI API key is not configured. Set GEMINI_API_KEY."
    );
  }

  const baseURL = geminiApiKey
    ? process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai"
    : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

function getModel(): string {
  if (process.env.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL;
  }

  return "gemini-2.5-flash";
  
}

export function registerChatRoutes(app: Express): void {
  function getSessionId(req: Request): string {
    return req.sessionID || "anonymous-session";
  }

  // Get all conversations
  app.get("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations(getSessionId(req));
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation id" });
      }
      const sessionId = getSessionId(req);
      const conversation = await chatStorage.getConversation(sessionId, id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(sessionId, id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const safeTitle = typeof title === "string" && title.trim() ? title.trim().slice(0, 120) : "New Chat";
      const conversation = await chatStorage.createConversation(getSessionId(req), safeTitle);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation id" });
      }
      await chatStorage.deleteConversation(getSessionId(req), id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(String(req.params.id), 10);
      if (Number.isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation id" });
      }

      const sessionId = getSessionId(req);
      const conversation = await chatStorage.getConversation(sessionId, conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const { content } = req.body;
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const userContent = content.trim();

      // Save user message
      await chatStorage.createMessage(sessionId, conversationId, "user", userContent);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(sessionId, conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      // Stream response from OpenAI
      const openai = getOpenAIClient();
      const stream = await openai.chat.completions.create({
        model: getModel(),
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(sessionId, conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });
}

