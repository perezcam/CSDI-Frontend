import { api } from '../lib/api';
import type { RagQueryRequest, RagQueryResponse } from '../types/api';

export const chatService = {
  query: (body: RagQueryRequest) =>
    api.post<RagQueryResponse>('/api/v1/rag/query', body),
};
