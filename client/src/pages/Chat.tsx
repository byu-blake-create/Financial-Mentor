import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2, Mic } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
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

  // Create if needed
  useEffect(() => {
    if (conversations && conversations.length === 0 && !createConversation.isPending && !activeConversationId) {
      createConversation.mutate();
    }
  }, [conversations]);

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
    refetchInterval: 1000, // Poll for updates since we're using SSE for the stream
  });

  // 5. Send message mutation (simulates streaming by polling after send)
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConversationId) throw new Error("No conversation");
      
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error("Failed to send");
      // The response is a stream, but for this basic implementation we'll let the polling pick up the new messages
      // Ideally we'd read the stream here
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
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['/api/conversations', activeConversationId], context?.previousConversation);
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

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-card rounded-2xl border shadow-sm overflow-hidden animate-in fade-in duration-500">
      {/* Chat Header */}
      <div className="bg-primary/5 border-b p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg font-display text-foreground">Prosper AI Expert</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online & Ready to help
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
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
                "flex max-w-[80%] items-start gap-3 p-4 rounded-2xl shadow-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-white dark:bg-slate-800 border rounded-tl-none"
              )}
            >
              {msg.role === "assistant" && (
                <Bot className="w-5 h-5 mt-1 shrink-0 opacity-70" />
              )}
              <p className="leading-relaxed text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "user" && user?.profileImageUrl && (
                <img src={user.profileImageUrl} alt="me" className="w-6 h-6 rounded-full mt-1 shrink-0" />
              )}
            </div>
          </div>
        ))}
        
        {sendMessage.isPending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <Bot className="w-5 h-5 opacity-70" />
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your budget, savings, or investing..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              disabled={sendMessage.isPending || !activeConversationId}
            />
            <button 
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sendMessage.isPending || !activeConversationId}
            className="bg-primary text-white p-3 rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Prosper AI provides financial guidance, not professional advice.
        </p>
      </div>
    </div>
  );
}
