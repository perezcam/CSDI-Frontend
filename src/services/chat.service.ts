import { api } from '../lib/api';
import type {
  RagHistoryResponse,
  RagQueryRequest,
  RagQueryResponse,
} from '../types/api';

export const chatService = {
  query: (body: RagQueryRequest) =>
    api.post<RagQueryResponse>('/api/v1/rag/query', body),
  getHistory: (sessionId: string) =>
    api.get<RagHistoryResponse>(`/api/v1/rag/history/${sessionId}`),
};
