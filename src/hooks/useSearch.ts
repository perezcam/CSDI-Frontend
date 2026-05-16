import { useState, useCallback } from 'react';
import { searchService } from '../services/search.service';

export type SearchMode = 'bm25' | 'vector' | 'hybrid';

export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  text: string;
  score: number;
  sourceId: string;
  breadcrumb: string;
  rank: number;
  chunkIndex: number;   // position within the source document (0-based)
  docHash: string;      // identifies which page/document the chunk came from
}

/** Parse chunk_id format: "{source_id}:{url_hash}:{chunk_index}" */
function parseChunkId(id: string): { chunkIndex: number; docHash: string } {
  const parts = id.split(':');
  if (parts.length >= 3) {
    return { chunkIndex: parseInt(parts[parts.length - 1], 10) || 0, docHash: parts[parts.length - 2] };
  }
  return { chunkIndex: 0, docHash: '' };
}

export interface SearchRun {
  mode: SearchMode;
  results: SearchResultItem[];
}

export function useSearch() {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [runs, setRuns] = useState<SearchRun[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, mode: SearchMode, topK: number) => {
    if (!query.trim()) return;

    setError(null);
    setRuns([]);
    setResults([]);
    setIsSearching(true);

    try {
      if (mode === 'hybrid') {
        const response = await searchService.hybrid({ query, top_k: topK });
        const mapped = response.results.map((r, i) => ({
          id: r.chunk_id,
          title: r.title,
          url: r.url,
          text: r.text,
          score: r.score,
          sourceId: r.source_id,
          breadcrumb: r.breadcrumb,
          rank: i + 1,
          ...parseChunkId(r.chunk_id),
        }));
        setResults(mapped);
        setRuns([{ mode: 'hybrid', results: mapped }]);
      } else if (mode === 'bm25') {
        const response = await searchService.bm25({ query, top_k: topK });
        const mapped = response.results.map((r, i) => ({
          id: r.doc_id,
          title: r.title,
          url: r.url,
          text: r.text,
          score: r.score,
          sourceId: r.source_id,
          breadcrumb: r.breadcrumb,
          rank: i + 1,
          ...parseChunkId(r.doc_id),
        }));
        setResults(mapped);
        setRuns([{ mode: 'bm25', results: mapped }]);
      } else {
        const response = await searchService.vector({ query, top_k: topK });
        const mapped = response.results.map((r, i) => ({
          id: r.doc_id,
          title: r.title,
          url: r.url,
          text: r.text,
          score: r.score,
          sourceId: r.source_id,
          breadcrumb: r.breadcrumb,
          rank: i + 1,
          ...parseChunkId(r.doc_id),
        }));
        setResults(mapped);
        setRuns([{ mode: 'vector', results: mapped }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar la búsqueda');
      setResults([]);
      setRuns([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const compareAll = useCallback(async (query: string, topK: number) => {
    if (!query.trim()) return;
    setError(null);
    setRuns([]);
    setResults([]);
    setIsSearching(true);
    try {
      const [hybrid, bm25, vector] = await Promise.all([
        searchService.hybrid({ query, top_k: topK }),
        searchService.bm25({ query, top_k: topK }),
        searchService.vector({ query, top_k: topK }),
      ]);

      const mappedHybrid: SearchResultItem[] = hybrid.results.map((r, i) => ({
        id: r.chunk_id, title: r.title, url: r.url, text: r.text, score: r.score, sourceId: r.source_id, breadcrumb: r.breadcrumb, rank: i + 1, ...parseChunkId(r.chunk_id),
      }));
      const mappedBm25: SearchResultItem[] = bm25.results.map((r, i) => ({
        id: r.doc_id, title: r.title, url: r.url, text: r.text, score: r.score, sourceId: r.source_id, breadcrumb: r.breadcrumb, rank: i + 1, ...parseChunkId(r.doc_id),
      }));
      const mappedVector: SearchResultItem[] = vector.results.map((r, i) => ({
        id: r.doc_id, title: r.title, url: r.url, text: r.text, score: r.score, sourceId: r.source_id, breadcrumb: r.breadcrumb, rank: i + 1, ...parseChunkId(r.doc_id),
      }));

      setRuns([
        { mode: 'hybrid', results: mappedHybrid },
        { mode: 'bm25', results: mappedBm25 },
        { mode: 'vector', results: mappedVector },
      ]);
      setResults(mappedHybrid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al comparar métodos');
      setRuns([]);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setRuns([]);
    setError(null);
  }, []);

  return { results, runs, isSearching, error, search, compareAll, clearResults };
}
