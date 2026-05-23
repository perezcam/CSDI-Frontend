// API types — mirror the CSDI-RAG-Engine backend schemas

// ─── RAG / Chat ───────────────────────────────────────────────────────────────

export interface RagQueryRequest {
  query: string;
  session_id?: string;
}

export interface RagSource {
  chunk_id: string;
  url: string;
  title: string;
  source_type?: SourceType;
  retrieval_method?: string;
  relevance_score?: number;
  freshness_score?: number;
  display_priority?: number;
  rank?: number;
}

export interface RagQueryResponse {
  query: string;
  answer: string;
  sources: RagSource[];
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  web_search?: unknown;
}

export interface RagHistoryMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: RagSource[];
  model?: string;
}

export interface RagHistoryResponse {
  session_id: string;
  messages: RagHistoryMessage[];
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchRequest {
  query: string;
  top_k?: number;
  source_ids?: string[];
}

export type SourceType = 'corpus' | 'web_cache' | (string & {});

/** Full chunk metadata — returned by hybrid search */
export interface SearchChunk {
  chunk_id: string;
  score: number;
  relevance_score?: number;
  freshness_score?: number;
  display_priority?: number;
  rank?: number;
  source_type?: SourceType;
  retrieval_method?: string;
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
  source_id: string;
  url: string;
  title: string;
  breadcrumb: string;
  text: string;
}

export interface Bm25SearchResponse {
  results: Bm25Result[];
}

export interface VectorResult {
  doc_id: string;
  score: number;
  source_id: string;
  url: string;
  title: string;
  breadcrumb: string;
  text: string;
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
  indexed_chunks: number;
  last_ingest_at?: string | null;
  ingest_status?: 'idle' | 'crawling' | 'indexing' | 'completed' | 'error';
  progress_pct?: number;
  sample_url?: string | null;
  source_kind?: 'configured' | 'url_manual' | 'upload_file';
}

export interface IngestProgressResponse {
  source_id: string;
  phase: 'idle' | 'crawling' | 'indexing' | 'completed' | 'error';
  pages_total: number;
  pages_scraped: number;
  chunks_indexed: number;
  progress_pct: number;
  started_at: string | null;
  finished_at: string | null;
  last_ingest_at: string | null;
  error: string | null;
}

export interface PipelineConfig {
  bm25_weight: number;
  vector_weight: number;
  temperature: number;
  model: string;
  reranker_enabled: boolean;
  reranker_candidate_k: number;
  context_chunks: number;
  max_tokens: number;
  hyde_enabled: boolean;
  llm_base_url: string;
  llm_api_key: string;
  provider: string;
  available_models: string[];
  insuff: InsuffConfig;
}

export interface InsuffConfig {
  confidence_threshold: number;
  min_results: number;
  expected_results: number;
  min_top_score: number;
  min_relevant_results: number;
  min_coverage_score: number;
  min_answerability_score: number;
  min_source_diversity: number;
  coverage_top_n: number;
  w_top: number;
  w_quantity: number;
  w_coverage: number;
  w_diversity: number;
  w_answerability: number;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'error';
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface MetricsResponse {
  total_chunks: number;
  faiss_vectors: number;
  bm25_documents: number;
  bm25_terms: number;
  total_documents: number;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadResponse {
  source_id: string;
  filename: string;
  chunks_produced: number;
  chunks_indexed: number;
}

// ─── Evaluation ──────────────────────────────────────────────────────────────

export type RetrievalStrategy = 'bm25' | 'vector' | 'hybrid';

export interface EvaluationQuery {
  id: string;
  query: string;
  source_ids?: string[] | null;
}

export interface EvaluationQueryCreateRequest {
  query: string;
  source_ids?: string[] | null;
}

export interface EvaluationRankingRunRequest {
  top_k: number;
  strategies: RetrievalStrategy[];
}

export interface EvaluationRankingResult {
  chunk_id: string;
  score?: number | null;
  source_id?: string | null;
  url?: string | null;
  title?: string | null;
  breadcrumb?: string | null;
  text?: string | null;
  current_relevance?: number | null;
}

export interface EvaluationRankingsResponse {
  query: EvaluationQuery;
  top_k: number;
  rankings: Partial<Record<RetrievalStrategy, EvaluationRankingResult[]>>;
}

export interface EvaluationJudgmentUpdateRequest {
  relevance: 0 | 1 | 2 | 3;
  notes?: string | null;
}

export interface EvaluationJudgmentResponse {
  query_id: string;
  chunk_id: string;
  relevance: 0 | 1 | 2 | 3;
}

export interface EvaluationJudgmentsResponse {
  query_id: string;
  judgments: Record<string, number>;
}

export interface StrategyMetrics {
  precision_at_k: number;
  recall_at_k: number;
  f1_at_k: number;
  reciprocal_rank: number;
  ndcg_at_k: number;
}

export interface EvaluationStrategyReport {
  k: number;
  evaluated_queries: number;
  per_query: Record<string, StrategyMetrics>;
  averages: StrategyMetrics;
}

export interface EvaluationReport {
  k: number;
  strategies: Partial<Record<RetrievalStrategy, EvaluationStrategyReport>>;
}

export interface EvaluationSummary {
  queries_count: number;
  judged_queries_count: number;
  total_judgments: number;
  available_strategies: RetrievalStrategy[];
  latest_report_exists: boolean;
  latest_averages: Partial<Record<RetrievalStrategy, Partial<StrategyMetrics>>>;
}
