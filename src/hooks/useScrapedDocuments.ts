import { useCallback, useEffect, useRef, useState } from 'react';
import { scrapedDocumentsService } from '../services/scrapedDocuments.service';
import type { ScrapedDocumentsQueryParams, ScrapedDocumentsResponse } from '../types/api';

export function useScrapedDocuments(params: ScrapedDocumentsQueryParams) {
  const [data, setData] = useState<ScrapedDocumentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchDocuments = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setIsLoading(true);
    setError(null);

    try {
      const response = await scrapedDocumentsService.list(params);
      if (requestId.current === currentRequest) {
        setData(response);
      }
    } catch (err) {
      if (requestId.current === currentRequest) {
        setError(err instanceof Error ? err.message : 'Error al cargar documentos scrapeados');
      }
    } finally {
      if (requestId.current === currentRequest) {
        setIsLoading(false);
      }
    }
  }, [params.page, params.page_size, params.source_id, params.active_only]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  return { data, isLoading, error, refetch: fetchDocuments };
}
