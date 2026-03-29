import { useState, useEffect, useCallback } from 'react';
import { sourcesService } from '../services/sources.service';
import type { ConfiguredSource } from '../types/api';

export type IngestStatus = 'idle' | 'ingesting' | 'completed' | 'error';

export interface SourceWithStatus extends ConfiguredSource {
  ingestStatus: IngestStatus;
  lastIngest?: Date;
  lastReport?: {
    pagesCrawled: number;
    chunksIndexed: number;
  };
}

export function useSources() {
  const [sources, setSources] = useState<SourceWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await sourcesService.list();
      setSources(data.map(s => ({ ...s, ingestStatus: 'idle' as IngestStatus })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las fuentes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const ingest = useCallback(async (sourceId: string) => {
    setSources(prev =>
      prev.map(s =>
        s.source_id === sourceId ? { ...s, ingestStatus: 'ingesting' as IngestStatus } : s,
      ),
    );
    try {
      const report = await sourcesService.ingest({ source_id: sourceId });
      setSources(prev =>
        prev.map(s =>
          s.source_id === sourceId
            ? {
                ...s,
                ingestStatus: 'completed' as IngestStatus,
                lastIngest: new Date(),
                lastReport: {
                  pagesCrawled: report.pages_crawled,
                  chunksIndexed: report.chunks_indexed,
                },
              }
            : s,
        ),
      );
    } catch (err) {
      setSources(prev =>
        prev.map(s =>
          s.source_id === sourceId ? { ...s, ingestStatus: 'error' as IngestStatus } : s,
        ),
      );
    }
  }, []);

  return { sources, isLoading, error, ingest, refetch: fetchSources };
}
