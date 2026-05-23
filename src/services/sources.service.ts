import { api } from '../lib/api';
import type { ConfiguredSource, DeindexResponse, IngestProgressResponse, IngestRequest, IngestResponse, UploadResponse } from '../types/api';

export const sourcesService = {
  /** List all pre-configured documentation sources */
  list: () => api.get<ConfiguredSource[]>('/api/v1/ingest/sources'),

  /** Trigger full crawl → chunk → index pipeline for a configured source */
  ingest: (body: IngestRequest) =>
    api.post<IngestResponse>('/api/v1/ingest', body),

  /** Poll ingestion progress for a source */
  progress: (sourceId: string) =>
    api.get<IngestProgressResponse>(`/api/v1/ingest/progress/${encodeURIComponent(sourceId)}`),

  /** Remove all indexed data for a source */
  deindex: (sourceId: string) =>
    api.delete<DeindexResponse>(`/api/v1/ingest/sources/${encodeURIComponent(sourceId)}`),

  /** Upload file and run chunk + index pipeline immediately */
  upload: (file: File, sourceId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (sourceId?.trim()) {
      form.append('source_id', sourceId.trim());
    }
    return api.postForm<UploadResponse>('/api/v1/upload', form);
  },
};
