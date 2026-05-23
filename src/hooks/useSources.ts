import { useState, useEffect, useCallback, useRef } from 'react';
import { sourcesService } from '../services/sources.service';
import type { ConfiguredSource } from '../types/api';

export type IngestStatus = 'idle' | 'crawling' | 'indexing' | 'completed' | 'error';

export interface SourceWithStatus extends ConfiguredSource {
  ingestStatus: IngestStatus;
  progressPct: number;
  lastIngest?: Date;
  lastReport?: {
    pagesCrawled: number;
    chunksIndexed: number;
  };
}

const LS_KEY = 'csdi_ingesting_sources';

function getPersistedIngesting(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function setPersistedIngesting(ids: Set<string>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

function deriveStatus(source: ConfiguredSource, persistedIngesting: Set<string>): IngestStatus {
  if (persistedIngesting.has(source.source_id)) return 'indexing';
  const phase = source.ingest_status;
  if (phase === 'crawling' || phase === 'indexing') return phase;
  if (phase === 'completed') return 'completed';
  if (phase === 'error') return 'error';
  if (source.indexed_chunks > 0) return 'completed';
  return 'idle';
}

export function useSources() {
  const [sources, setSources] = useState<SourceWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const stopPolling = useCallback((sourceId: string) => {
    const timer = pollTimers.current.get(sourceId);
    if (timer !== undefined) {
      clearInterval(timer);
      pollTimers.current.delete(sourceId);
    }
  }, []);

  const startPolling = useCallback((sourceId: string) => {
    if (pollTimers.current.has(sourceId)) return;

    let requestInFlight = false;
    const timer = setInterval(async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const progress = await sourcesService.progress(sourceId);
        const phase = progress.phase;

        setSources(prev =>
          prev.map(s => {
            if (s.source_id !== sourceId) return s;
            return {
              ...s,
              ingestStatus: phase as IngestStatus,
              progressPct: progress.progress_pct,
              lastIngest: progress.last_ingest_at ? new Date(progress.last_ingest_at) : s.lastIngest,
            };
          }),
        );

        if (phase === 'completed' || phase === 'error' || phase === 'idle') {
          stopPolling(sourceId);
          const persisted = getPersistedIngesting();
          persisted.delete(sourceId);
          setPersistedIngesting(persisted);

          if (phase === 'completed') {
            const latest = await sourcesService.list();
            setSources(prev =>
              prev.map(s => {
                const fresh = latest.find(item => item.source_id === s.source_id);
                if (!fresh) return s;
                return {
                  ...s,
                  ...fresh,
                  ingestStatus: 'completed' as IngestStatus,
                  progressPct: 100,
                  lastIngest: fresh.last_ingest_at ? new Date(fresh.last_ingest_at) : s.lastIngest,
                };
              }),
            );
          }
        }
      } catch {
        // network blip — keep polling
      } finally {
        requestInFlight = false;
      }
    }, 2000);

    pollTimers.current.set(sourceId, timer);
  }, [stopPolling]);

  const fetchSources = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await sourcesService.list();
      const persistedIngesting = getPersistedIngesting();

      setSources(data.map(s => ({
        ...s,
        ingestStatus: deriveStatus(s, persistedIngesting),
        progressPct: s.progress_pct ?? 0,
        lastIngest: s.last_ingest_at ? new Date(s.last_ingest_at) : undefined,
      })));

      for (const sourceId of persistedIngesting) {
        startPolling(sourceId);
      }
      for (const s of data) {
        if (s.ingest_status === 'crawling' || s.ingest_status === 'indexing') {
          startPolling(s.source_id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las fuentes');
    } finally {
      setIsLoading(false);
    }
  }, [startPolling]);

  useEffect(() => {
    fetchSources();
    return () => {
      for (const timer of pollTimers.current.values()) clearInterval(timer);
      pollTimers.current.clear();
    };
  }, [fetchSources]);

  const deindex = useCallback(async (sourceId: string) => {
    setSources(prev =>
      prev.map(s =>
        s.source_id === sourceId
          ? { ...s, ingestStatus: 'idle' as IngestStatus, progressPct: 0, indexed_chunks: 0, lastIngest: undefined }
          : s,
      ),
    );
    try {
      await sourcesService.deindex(sourceId);
      // For user sources the entry is fully removed — refresh the full list
      const latest = await sourcesService.list();
      setSources(latest.map(s => ({
        ...s,
        ingestStatus: deriveStatus(s, getPersistedIngesting()),
        progressPct: s.progress_pct ?? 0,
        lastIngest: s.last_ingest_at ? new Date(s.last_ingest_at) : undefined,
      })));
    } catch {
      // Revert optimistic update on failure
      fetchSources();
    }
  }, [fetchSources]);

  const ingest = useCallback(async (sourceId: string) => {
    setSources(prev =>
      prev.map(s =>
        s.source_id === sourceId
          ? { ...s, ingestStatus: 'crawling' as IngestStatus, progressPct: 0 }
          : s,
      ),
    );
    const persisted = getPersistedIngesting();
    persisted.add(sourceId);
    setPersistedIngesting(persisted);
    startPolling(sourceId);

    try {
      const report = await sourcesService.ingest({ source_id: sourceId });
      setSources(prev =>
        prev.map(s => {
          if (s.source_id !== sourceId) return s;
          return {
            ...s,
            ingestStatus: 'completed' as IngestStatus,
            progressPct: 100,
            lastIngest: new Date(),
            lastReport: {
              pagesCrawled: report.pages_crawled,
              chunksIndexed: report.chunks_indexed,
            },
          };
        }),
      );
    } catch {
      setSources(prev =>
        prev.map(s =>
          s.source_id === sourceId ? { ...s, ingestStatus: 'error' as IngestStatus } : s,
        ),
      );
    } finally {
      stopPolling(sourceId);
      const p = getPersistedIngesting();
      p.delete(sourceId);
      setPersistedIngesting(p);
    }
  }, [startPolling, stopPolling]);

  return { sources, isLoading, error, ingest, deindex, refetch: fetchSources };
}
