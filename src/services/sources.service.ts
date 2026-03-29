import { api } from '../lib/api';
import type { ConfiguredSource, IngestRequest, IngestResponse } from '../types/api';

export const sourcesService = {
  /** List all pre-configured documentation sources */
  list: () => api.get<ConfiguredSource[]>('/api/v1/ingest/sources'),

  /** Trigger full crawl → chunk → index pipeline for a configured source */
  ingest: (body: IngestRequest) =>
    api.post<IngestResponse>('/api/v1/ingest', body),
};
