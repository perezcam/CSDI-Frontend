import { api } from '../lib/api';
import type { ScrapedDocumentsQueryParams, ScrapedDocumentsResponse } from '../types/api';

function buildDocumentsQuery(params: ScrapedDocumentsQueryParams) {
  const query = new URLSearchParams();

  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));
  query.set('active_only', String(params.active_only ?? true));

  const sourceId = params.source_id?.trim();
  if (sourceId) {
    query.set('source_id', sourceId);
  }

  return query.toString();
}

export const scrapedDocumentsService = {
  list: (params: ScrapedDocumentsQueryParams = {}) =>
    api.get<ScrapedDocumentsResponse>(`/api/v1/ingest/documents?${buildDocumentsQuery(params)}`),
};
