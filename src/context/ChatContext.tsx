import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { chatService } from '../services/chat.service';
import type { RagSource } from '../types/api';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: RagSource[];
  model?: string;
}

interface ChatContextValue {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (query: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    setError(null);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    }]);
    setIsLoading(true);

    try {
      const response = await chatService.query({ query });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
        model: response.model,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el backend');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, isLoading, error, sendMessage, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be inside ChatProvider');
  return ctx;
}
