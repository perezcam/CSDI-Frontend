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
}

export function useSearch() {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, mode: SearchMode, topK: number) => {
    if (!query.trim()) return;

    setError(null);
    setIsSearching(true);

    try {
      if (mode === 'hybrid') {
        const response = await searchService.hybrid({ query, top_k: topK });
        setResults(
          response.results.map((r, i) => ({
            id: r.chunk_id,
            title: r.title,
            url: r.url,
            text: r.text,
            score: r.score,
            sourceId: r.source_id,
            breadcrumb: r.breadcrumb,
            rank: i + 1,
          })),
        );
      } else if (mode === 'bm25') {
        // BM25 endpoint returns doc_id + score only (no chunk metadata)
        const response = await searchService.bm25({ query, top_k: topK });
        setResults(
          response.results.map((r, i) => ({
            id: r.doc_id,
            title: r.doc_id,
            url: '',
            text: '',
            score: r.score,
            sourceId: '',
            breadcrumb: '',
            rank: i + 1,
          })),
        );
      } else {
        // Vector endpoint returns doc_id + score only (no chunk metadata)
        const response = await searchService.vector({ query, top_k: topK });
        setResults(
          response.results.map((r, i) => ({
            id: r.doc_id,
            title: r.doc_id,
            url: '',
            text: '',
            score: r.score,
            sourceId: '',
            breadcrumb: '',
            rank: i + 1,
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ejecutar la búsqueda');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, isSearching, error, search, clearResults };
}
