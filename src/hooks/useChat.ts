import { useState, useCallback, useEffect } from 'react';
import { chatService } from '../services/chat.service';
import type { RagHistoryMessage, RagSource } from '../types/api';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: RagSource[];
  model?: string;
}

interface StoredChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: RagSource[];
  model?: string;
}

const CHAT_STORAGE_KEY = 'csdi_frontend_chat_messages_v1';
const CHAT_SESSION_KEY = 'csdi_frontend_chat_session_v1';

let inMemorySessionId: string | null = null;
let inMemoryMessages: ChatMessage[] | null = null;

function getOrCreateSessionId(): string {
  if (inMemorySessionId) return inMemorySessionId;
  if (typeof window === 'undefined') return 'server-session';

  const existing = window.localStorage.getItem(CHAT_SESSION_KEY);
  if (existing) {
    inMemorySessionId = existing;
    return existing;
  }

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now()}${Math.random().toString(36).slice(2, 12)}`;

  window.localStorage.setItem(CHAT_SESSION_KEY, generated);
  inMemorySessionId = generated;
  return generated;
}

function serializeMessages(messages: ChatMessage[]): StoredChatMessage[] {
  return messages.map((message) => ({
    ...message,
    timestamp: message.timestamp.toISOString(),
  }));
}

function parseStoredMessages(value: string | null): ChatMessage[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as StoredChatMessage[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((message) => (
        message &&
        typeof message.id === 'string' &&
        (message.type === 'user' || message.type === 'assistant') &&
        typeof message.content === 'string' &&
        typeof message.timestamp === 'string'
      ))
      .map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      }));
  } catch {
    return [];
  }
}

function fromHistory(messages: RagHistoryMessage[]): ChatMessage[] {
  return messages
    .filter((message) => (
      message &&
      typeof message.id === 'string' &&
      (message.type === 'user' || message.type === 'assistant') &&
      typeof message.content === 'string' &&
      typeof message.timestamp === 'string'
    ))
    .map((message) => ({
      id: message.id,
      type: message.type,
      content: message.content,
      timestamp: new Date(message.timestamp),
      sources: message.sources,
      model: message.model,
    }));
}

function persistMessages(messages: ChatMessage[]): void {
  inMemoryMessages = messages;
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(serializeMessages(messages)));
}

function mergeMessages(preferred: ChatMessage[], fallback: ChatMessage[]): ChatMessage[] {
  if (preferred.length >= fallback.length) return preferred;
  return fallback;
}

export function useChat() {
  const [sessionId] = useState<string>(() => getOrCreateSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (inMemoryMessages) return inMemoryMessages;
    if (typeof window === 'undefined') return [];

    const local = parseStoredMessages(window.localStorage.getItem(CHAT_STORAGE_KEY));
    inMemoryMessages = local;
    return local;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const response = await chatService.getHistory(sessionId);
        if (cancelled) return;

        const historyMessages = fromHistory(response.messages);
        setMessages((current) => mergeMessages(historyMessages, current));
      } catch {
        // Keep local cache as fallback when Redis/backend history is unavailable.
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    setError(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const next = [...prev, userMessage];
      persistMessages(next);
      return next;
    });
    setIsLoading(true);

    try {
      const response = await chatService.query({ query, session_id: sessionId });
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
        model: response.model,
      };
      setMessages((prev) => {
        const next = [...prev, assistantMessage];
        persistMessages(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el backend');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    persistMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
