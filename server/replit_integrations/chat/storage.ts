export interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
}

export interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

interface SessionConversation extends Conversation {
  messages: Message[];
}

interface SessionStore {
  nextConversationId: number;
  nextMessageId: number;
  conversations: SessionConversation[];
}

const sessionChats = new Map<string, SessionStore>();

function getSessionStore(sessionId: string): SessionStore {
  let store = sessionChats.get(sessionId);
  if (!store) {
    store = {
      nextConversationId: 1,
      nextMessageId: 1,
      conversations: [],
    };
    sessionChats.set(sessionId, store);
  }
  return store;
}

export interface IChatStorage {
  getConversation(sessionId: string, id: number): Promise<Conversation | undefined>;
  getAllConversations(sessionId: string): Promise<Conversation[]>;
  createConversation(sessionId: string, title: string): Promise<Conversation>;
  deleteConversation(sessionId: string, id: number): Promise<void>;
  getMessagesByConversation(sessionId: string, conversationId: number): Promise<Message[]>;
  createMessage(sessionId: string, conversationId: number, role: string, content: string): Promise<Message>;
}

export const chatStorage: IChatStorage = {
  async getConversation(sessionId: string, id: number) {
    const store = getSessionStore(sessionId);
    return store.conversations.find((conversation) => conversation.id === id);
  },

  async getAllConversations(sessionId: string) {
    const store = getSessionStore(sessionId);
    return [...store.conversations].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  },

  async createConversation(sessionId: string, title: string) {
    const store = getSessionStore(sessionId);
    const conversation: SessionConversation = {
      id: store.nextConversationId++,
      title,
      createdAt: new Date(),
      messages: [],
    };
    store.conversations.push(conversation);
    return conversation;
  },

  async deleteConversation(sessionId: string, id: number) {
    const store = getSessionStore(sessionId);
    store.conversations = store.conversations.filter((conversation) => conversation.id !== id);
  },

  async getMessagesByConversation(sessionId: string, conversationId: number) {
    const store = getSessionStore(sessionId);
    const conversation = store.conversations.find((item) => item.id === conversationId);
    return conversation ? [...conversation.messages] : [];
  },

  async createMessage(sessionId: string, conversationId: number, role: string, content: string) {
    const store = getSessionStore(sessionId);
    const conversation = store.conversations.find((item) => item.id === conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const message: Message = {
      id: store.nextMessageId++,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };

    conversation.messages.push(message);
    return message;
  },
};

