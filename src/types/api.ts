// API types — mirror the CSDI-RAG-Engine backend schemas

// ─── RAG / Chat ───────────────────────────────────────────────────────────────

export interface RagQueryRequest {
  query: string;
}

export interface RagSource {
  chunk_id: string;
  url: string;
  title: string;
}

export interface RagQueryResponse {
  query: string;
  answer: string;
  sources: RagSource[];
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchRequest {
  query: string;
  top_k?: number;
}

/** Full chunk metadata — returned by hybrid search */
export interface SearchChunk {
  chunk_id: string;
  score: number;
  source_id: string;
  url: string;
  title: string;
  breadcrumb: string;
  text: string;
}

export interface HybridSearchResponse {
  query: string;
  results: SearchChunk[];
}

/** Lightweight result — returned by BM25 and vector endpoints */
export interface Bm25Result {
  doc_id: string;
  score: number;
}

export interface Bm25SearchResponse {
  results: Bm25Result[];
}

export interface VectorResult {
  doc_id: string;
  score: number;
}

export interface VectorSearchResponse {
  results: VectorResult[];
}

// ─── Ingestion / Sources ──────────────────────────────────────────────────────

export interface IngestRequest {
  source_id: string;
}

export interface IngestResponse {
  source_id: string;
  status: string;
  pages_crawled: number;
  pages_scraped: number;
  chunks_produced: number;
  chunks_indexed: number;
}

export interface ConfiguredSource {
  source_id: string;
  name: string;
  base_url: string;
  technology: string[];
  seed_urls: string[];
  max_depth: number;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'error';
}
