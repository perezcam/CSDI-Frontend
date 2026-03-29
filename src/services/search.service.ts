import { api } from '../lib/api';
import type {
  SearchRequest,
  HybridSearchResponse,
  Bm25SearchResponse,
  VectorSearchResponse,
} from '../types/api';

export const searchService = {
  /** Hybrid BM25 + vector search with RRF fusion — returns full chunk metadata */
  hybrid: (body: SearchRequest) =>
    api.post<HybridSearchResponse>('/api/v1/search', body),

  /** Pure BM25 keyword search — returns doc_id + score only */
  bm25: (body: SearchRequest) =>
    api.post<Bm25SearchResponse>('/api/v1/search/bm25', body),

  /** Dense vector (FAISS) search — returns doc_id + score only */
  vector: (body: SearchRequest) =>
    api.post<VectorSearchResponse>('/api/v1/vector/search', body),
};
