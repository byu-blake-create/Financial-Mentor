import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, Mic, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// Types for chat
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  messages: Message[];
}

export default function Chat() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  // 1. Fetch conversations list to get the latest one
  const { data: conversations } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return await res.json() as { id: number, title: string }[];
    }
  });

  // 2. Set active conversation to most recent, or create one if none exist
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations]);

  // 3. Create conversation mutation
  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/conversations', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: "New Chat" }),
        credentials: 'include' 
      });
      if (!res.ok) throw new Error("Failed");
      return await res.json();
    },
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setActiveConversationId(newConv.id);
    }
  });

  // Create if needed - removed auto-create; user must click "New Chat"

  // 4. Fetch messages for active conversation
  const { data: conversationData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/conversations', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return null;
      const res = await fetch(`/api/conversations/${activeConversationId}`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed");
      return await res.json() as Conversation;
    },
    enabled: !!activeConversationId,
  });

  // 5. Send message mutation with live SSE streaming updates
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConversationId) throw new Error("No conversation");
      
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        let details = "";
        const text = await res.text();
        if (text.trim()) {
          try {
            const data = JSON.parse(text) as { error?: string; message?: string };
            details = data.error || data.message || text;
          } catch {
            details = text;
          }
        }
        if (!details) {
          details =
            res.status === 429
              ? "Rate limited by the AI provider. Wait ~10–30 seconds and try again."
              : res.status === 503
                ? "Service unavailable (AI provider may be overloaded). Try again shortly."
                : res.statusText || "Request failed";
        }

        const statusLine = `${res.status} ${res.statusText}`.trim();
        const suffix = details ? `: ${details}` : "";
        throw new Error(`${statusLine}${suffix}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Streaming not available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantMessageId: number | null = null;

      const appendAssistantContent = (delta: string) => {
        queryClient.setQueryData(['/api/conversations', activeConversationId], (old: Conversation | null | undefined) => {
          if (!old) return old;

          const messages = [...old.messages];
          if (assistantMessageId === null) {
            assistantMessageId = Date.now() + 1;
            messages.push({
              id: assistantMessageId,
              role: 'assistant',
              content: delta,
              createdAt: new Date().toISOString(),
            });
          } else {
            const idx = messages.findIndex((m) => m.id === assistantMessageId);
            if (idx >= 0) {
              messages[idx] = {
                ...messages[idx],
                content: `${messages[idx].content}${delta}`,
              };
            }
          }

          return { ...old, messages };
        });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const line = evt.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;

          const payload = line.slice(6);
          try {
            const data = JSON.parse(payload) as { content?: string; done?: boolean; error?: string };

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.content) {
              appendAssistantContent(data.content);
            }

            if (data.done) {
              return;
            }
          } catch (err) {
            throw err instanceof Error ? err : new Error("Failed to process stream data");
          }
        }
      }
    },
    onMutate: async (content) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/conversations', activeConversationId] });
      const previousConversation = queryClient.getQueryData(['/api/conversations', activeConversationId]);
      
      queryClient.setQueryData(['/api/conversations', activeConversationId], (old: Conversation | undefined) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages, 
            { id: Date.now(), role: 'user', content, createdAt: new Date().toISOString() }
          ]
        };
      });
      
      setInput("");
      return { previousConversation };
    },
    onError: (err, _newMessage, context) => {
      queryClient.setQueryData(['/api/conversations', activeConversationId], context?.previousConversation);
      const message = err instanceof Error ? err.message : "Failed to send message";
      toast({
        title: "Chat error",
        description: message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversationId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationData?.messages]);

  useEffect(() => {
    if (!sendMessage.isPending && activeConversationId) {
      chatLogRef.current?.focus();
    }
  }, [sendMessage.isPending, activeConversationId]);

  return (
    <section
      aria-labelledby="chat-heading"
      className="flex flex-col h-[calc(100dvh-1rem)] sm:h-[calc(100vh-2rem)] bg-card rounded-2xl border shadow-sm overflow-hidden animate-in fade-in duration-500"
    >
      {/* Chat Header */}
      <header className="bg-primary/5 border-b p-3 sm:p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20" aria-hidden="true">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 id="chat-heading" className="font-bold text-base sm:text-lg font-display text-foreground">Prosper</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
            Online & Ready to help
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => createConversation.mutate()}
            disabled={createConversation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            aria-label="Start a new chat"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">New Chat</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main
        ref={chatLogRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-muted/10"
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
        aria-busy={sendMessage.isPending}
        tabIndex={0}
      >
        {!activeConversationId ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No conversation selected</p>
              <p className="text-sm text-muted-foreground mt-1">Click "New Chat" to start talking to Prosper.</p>
            </div>
            <button
              onClick={() => createConversation.mutate()}
              disabled={createConversation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-900/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Start New Chat
            </button>
          </div>
        ) : (
          <>
            {conversationData?.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex max-w-[92%] sm:max-w-[80%] items-start gap-3 p-3 sm:p-4 rounded-2xl shadow-sm",
                  msg.role === "user"
                    ? "bg-emerald-800 text-white rounded-tr-none"
                    : "bg-white dark:bg-slate-800 border rounded-tl-none"
                )}
                aria-label={msg.role === "user" ? "Your message" : "Prosper response"}
              >
                {msg.role === "assistant" && (
                  <Bot className="w-5 h-5 mt-1 shrink-0 opacity-70" aria-hidden="true" />
                )}
                {msg.role === "assistant" ? (
                  <div className="leading-relaxed text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="leading-relaxed text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.role === "user" && user?.profileImageUrl && (
                  <img src={user.profileImageUrl} alt="Your profile" className="w-6 h-6 rounded-full mt-1 shrink-0" />
                )}
              </div>
            </div>
            ))}
        
            {sendMessage.isPending && (
              <div className="flex justify-start" role="status" aria-live="polite" aria-label="Prosper is typing">
                <div className="bg-white dark:bg-slate-800 border rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                  <Bot className="w-5 h-5 opacity-70" aria-hidden="true" />
                  <div className="flex gap-1" aria-hidden="true">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                  </div>
                  <span className="sr-only">Generating response</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-3 sm:p-4 bg-card border-t">
        <form onSubmit={handleSubmit} className="flex gap-2" aria-label="Send a message to Prosper">
          <div className="relative flex-1">
            <label htmlFor="chat-message-input" className="sr-only">
              Message to Prosper
            </label>
            <input
              id="chat-message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your budget, savings, or investing..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/50 border border-input focus:bg-background focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none"
              disabled={sendMessage.isPending || !activeConversationId}
              aria-describedby="chat-disclaimer"
            />
            <button 
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-emerald-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-md"
              aria-label="Voice input not available yet"
              disabled
            >
              <Mic className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sendMessage.isPending || !activeConversationId}
            className="bg-emerald-800 text-white p-3 rounded-xl hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/25 hover:shadow-xl hover:shadow-emerald-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            aria-label="Send message"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </form>
        <p id="chat-disclaimer" className="text-center text-xs text-muted-foreground mt-2">
          Prosper provides financial guidance, not professional advice.
        </p>
      </footer>
    </section>
  );
}
