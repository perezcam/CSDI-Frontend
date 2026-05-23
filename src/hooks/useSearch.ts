import { useState, useCallback } from 'react';
import { searchService } from '../services/search.service';
import type { Bm25Result, SearchChunk, VectorResult } from '../types/api';

export type SearchMode = 'bm25' | 'vector' | 'hybrid';

export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  text: string;
  score: number;
  sourceId: string;
  sourceType?: string;
  retrievalMethod?: string;
  relevanceScore?: number;
  freshnessScore?: number;
  displayPriority?: number;
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

function sortByDisplayPriority<T extends { display_priority?: number; rank?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aPriority = a.display_priority ?? Number.NEGATIVE_INFINITY;
    const bPriority = b.display_priority ?? Number.NEGATIVE_INFINITY;

    if (aPriority !== bPriority) return bPriority - aPriority;
    return (a.rank ?? 0) - (b.rank ?? 0);
  });
}

function mapHybridResult(r: SearchChunk, index: number): SearchResultItem {
  return {
    id: r.chunk_id,
    title: r.title,
    url: r.url,
    text: r.text,
    score: r.score,
    sourceId: r.source_id,
    sourceType: r.source_type,
    retrievalMethod: r.retrieval_method,
    relevanceScore: r.relevance_score,
    freshnessScore: r.freshness_score,
    displayPriority: r.display_priority,
    breadcrumb: r.breadcrumb,
    rank: index + 1,
    ...parseChunkId(r.chunk_id),
  };
}

function mapLegacyResult(r: Bm25Result | VectorResult, index: number): SearchResultItem {
  return {
    id: r.doc_id,
    title: r.title,
    url: r.url,
    text: r.text,
    score: r.score,
    sourceId: r.source_id,
    breadcrumb: r.breadcrumb,
    rank: index + 1,
    ...parseChunkId(r.doc_id),
  };
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
        const mapped = sortByDisplayPriority(response.results).map(mapHybridResult);
        setResults(mapped);
        setRuns([{ mode: 'hybrid', results: mapped }]);
      } else if (mode === 'bm25') {
        const response = await searchService.bm25({ query, top_k: topK });
        const mapped = response.results.map(mapLegacyResult);
        setResults(mapped);
        setRuns([{ mode: 'bm25', results: mapped }]);
      } else {
        const response = await searchService.vector({ query, top_k: topK });
        const mapped = response.results.map(mapLegacyResult);
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

      const mappedHybrid: SearchResultItem[] = sortByDisplayPriority(hybrid.results).map(mapHybridResult);
      const mappedBm25: SearchResultItem[] = bm25.results.map(mapLegacyResult);
      const mappedVector: SearchResultItem[] = vector.results.map(mapLegacyResult);

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
