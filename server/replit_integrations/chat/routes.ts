import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { isAuthenticated } from "../auth";

const GEMINI_DEFAULT_MODELS = ["gemini-flash-latest", "gemini-2.5-flash"];

const FINANCIAL_MENTOR_SYSTEM_PROMPT = `You are Prosper, a practical financial mentor.

Answer as a mentor: short, direct, and actionable. **No intro/preamble** (don’t say “As a financial mentor…”). Jump straight to the help.

Stay focused on personal finance (budgeting, saving, debt, credit, goals, spending habits, basic investing/retirement concepts). If a request is unrelated, don’t answer it in depth—briefly redirect to a money-related angle or ask how it connects to their finances.

Ask up to 2 quick clarifying questions only when needed; otherwise provide a small plan (steps/bullets). Don’t ask for sensitive info (passwords, SSN, full account numbers). No guarantees; avoid making up rates or rules.`;

function buildChatCompletionMessages(
  history: Array<{ role: "user" | "assistant"; content: string }>
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [{ role: "system", content: FINANCIAL_MENTOR_SYSTEM_PROMPT }, ...history];
}

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

  return "gemini-flash-latest";
}

function getModelCandidates(): string[] {
  const configured = (process.env.GEMINI_MODEL || "").trim();
  const models = [configured, ...GEMINI_DEFAULT_MODELS].filter(Boolean);
  return Array.from(new Set(models));
}

function getErrorStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | undefined)?.status;
  return typeof status === "number" ? status : undefined;
}

function shouldTryNextModel(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 400 || status === 403 || status === 404;
}

function formatProviderError(error: unknown): string {
  const status = getErrorStatus(error);
  const providerMessage =
    (error as { error?: { message?: string } } | undefined)?.error?.message ||
    (error as { message?: string } | undefined)?.message ||
    "Unknown AI provider error";

  if (status === 403) {
    return `${providerMessage}. Verify GEMINI_API_KEY permissions and try GEMINI_MODEL=gemini-flash-latest.`;
  }

  if (status === 404) {
    return `${providerMessage}. The configured model may be unavailable for this key.`;
  }

  return providerMessage;
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

      // Create stream first so provider errors can be returned as normal JSON responses.
      const openai = getOpenAIClient();
      let stream: Awaited<ReturnType<typeof openai.chat.completions.create>> | null = null;
      let selectedModel = getModel();
      let lastProviderError: unknown;

      const modelCandidates = getModelCandidates();
      for (const model of modelCandidates) {
        try {
          stream = await openai.chat.completions.create({
            model,
            messages: buildChatCompletionMessages(chatMessages),
            stream: true,
            max_completion_tokens: 2048,
          });
          selectedModel = model;
          break;
        } catch (providerError) {
          lastProviderError = providerError;
          if (!shouldTryNextModel(providerError)) {
            break;
          }
        }
      }

      if (!stream) {
        throw lastProviderError ?? new Error("Failed to start AI response stream");
      }

      // Set up SSE only after stream is ready.
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

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

      if (selectedModel !== getModel()) {
        console.warn(`Configured model \"${getModel()}\" failed, fallback model \"${selectedModel}\" was used.`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = formatProviderError(error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      } else {
        const status = getErrorStatus(error) ?? 500;
        res.status(status).json({ error: errorMessage });
      }
    }
  });
}
