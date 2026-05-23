import { useCallback, useMemo, useRef, useState } from 'react';
import { useConfig } from './useConfig';
import { queryFeedbackService } from '../services/queryFeedback.service';
import { searchService } from '../services/search.service';
import type {
  QueryFeedbackAdjustedSearchResultItem,
  QueryFeedbackComparableResult,
  QueryFeedbackComparisonMode,
  QueryFeedbackComparisonOption,
  QueryFeedbackPreference,
  QueryFeedbackSearchResultItem,
  QueryFeedbackRelevance,
  SearchChunk,
} from '../types/api';

const DEFAULT_TOP_K = 10;
const DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD = 0.92;

type QueryFeedbackComparisonStrategy = QueryFeedbackComparisonOption['strategy'];

interface PreferenceTarget {
  chunk_id: string;
  source_id: string;
}

function clampProbability(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function normalizeHybridResults(results: SearchChunk[]): QueryFeedbackComparableResult[] {
  return results.map((result) => ({
    chunk_id: result.chunk_id,
    score: result.score,
    source_id: result.source_id,
    url: result.url,
    title: result.title,
    breadcrumb: result.breadcrumb,
    text: result.text,
  }));
}

function normalizeExpandedResults(results: QueryFeedbackSearchResultItem[]): QueryFeedbackComparableResult[] {
  return results.map((result) => ({
    chunk_id: result.chunk_id,
    score: result.score,
    source_id: result.source_id,
    url: result.url,
    title: result.title,
    breadcrumb: result.breadcrumb,
    text: result.text,
  }));
}

function normalizeFeedbackResults(
  results: QueryFeedbackAdjustedSearchResultItem[],
): QueryFeedbackComparableResult[] {
  return results.map((result) => ({
    chunk_id: result.chunk_id,
    score: result.adjusted_score,
    original_score: result.original_score,
    adjusted_score: result.adjusted_score,
    feedback_applied: result.feedback_applied,
    feedback_relevance: result.feedback_relevance,
    feedback_match_type: result.feedback_match_type,
    source_id: result.source_id,
    url: result.url,
    title: result.title,
    breadcrumb: result.breadcrumb,
    text: result.text,
  }));
}

function buildOption(
  id: 'A' | 'B',
  mode: Exclude<QueryFeedbackComparisonMode, 'none'>,
  strategy: QueryFeedbackComparisonStrategy,
  results: QueryFeedbackComparableResult[],
): QueryFeedbackComparisonOption {
  if (id === 'A') {
    return {
      id,
      label: 'Standard results',
      description: 'Standard hybrid retrieval results.',
      strategy,
      results,
    };
  }

  if (mode === 'feedback') {
    return {
      id,
      label: 'Results using previous feedback',
      description: 'Results adjusted using previously stored query feedback.',
      strategy,
      results,
    };
  }

  return {
    id,
    label: 'Results with expansion',
    description: 'Results generated using expanded retrieval terms.',
    strategy,
    results,
  };
}

function preferenceTargets(
  preference: QueryFeedbackPreference,
  optionA: QueryFeedbackComparisonOption | null,
  optionB: QueryFeedbackComparisonOption | null,
): Array<{ target: PreferenceTarget; relevance: QueryFeedbackRelevance; notes: string }> {
  const topA = optionA?.results[0] ?? null;
  const topB = optionB?.results[0] ?? null;

  switch (preference) {
    case 'prefer_a':
      return topA
        ? [{
            target: { chunk_id: topA.chunk_id, source_id: topA.source_id },
            relevance: 3,
            notes: 'User preferred option A in query feedback comparison.',
          }]
        : [];
    case 'prefer_b':
      return topB
        ? [{
            target: { chunk_id: topB.chunk_id, source_id: topB.source_id },
            relevance: 3,
            notes: 'User preferred option B in query feedback comparison.',
          }]
        : [];
    case 'both':
      return [
        topA
          ? {
              target: { chunk_id: topA.chunk_id, source_id: topA.source_id },
              relevance: 2,
              notes: 'User marked both query feedback comparison options as useful.',
            }
          : null,
        topB
          ? {
              target: { chunk_id: topB.chunk_id, source_id: topB.source_id },
              relevance: 2,
              notes: 'User marked both query feedback comparison options as useful.',
            }
          : null,
      ].filter((item): item is { target: PreferenceTarget; relevance: QueryFeedbackRelevance; notes: string } => item !== null);
    case 'neither':
      return [
        topA
          ? {
              target: { chunk_id: topA.chunk_id, source_id: topA.source_id },
              relevance: 0,
              notes: 'User marked neither query feedback comparison option as useful.',
            }
          : null,
        topB
          ? {
              target: { chunk_id: topB.chunk_id, source_id: topB.source_id },
              relevance: 0,
              notes: 'User marked neither query feedback comparison option as useful.',
            }
          : null,
      ].filter((item): item is { target: PreferenceTarget; relevance: QueryFeedbackRelevance; notes: string } => item !== null);
    default:
      return [];
  }
}

export function useQueryFeedbackComparison() {
  const { config, isLoading: isConfigLoading } = useConfig();

  const [isComparisonActive, setIsComparisonActive] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<QueryFeedbackComparisonMode>('none');
  const [optionA, setOptionA] = useState<QueryFeedbackComparisonOption | null>(null);
  const [optionB, setOptionB] = useState<QueryFeedbackComparisonOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [preferenceSaved, setPreferenceSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentQueryRef = useRef<string>('');
  const lastRequestIdRef = useRef(0);

  const probability = useMemo(
    () => clampProbability(isConfigLoading || !config ? 0 : config.query_feedback_comparison_probability),
    [config, isConfigLoading],
  );

  const resetComparison = useCallback(() => {
    currentQueryRef.current = '';
    setIsComparisonActive(false);
    setComparisonMode('none');
    setOptionA(null);
    setOptionB(null);
    setIsLoading(false);
    setIsSavingPreference(false);
    setPreferenceSaved(false);
    setError(null);
  }, []);

  const startComparison = useCallback(async (query: string, topK: number = DEFAULT_TOP_K): Promise<boolean> => {
    const trimmedQuery = query.trim();
    const requestId = lastRequestIdRef.current + 1;
    lastRequestIdRef.current = requestId;

    resetComparison();

    if (!trimmedQuery) {
      return false;
    }

    if (!(Math.random() < probability)) {
      return false;
    }

    setIsLoading(true);
    currentQueryRef.current = trimmedQuery;

    try {
      const feedbackLookup = await queryFeedbackService.feedbackByQuery(trimmedQuery);
      const nextMode: Exclude<QueryFeedbackComparisonMode, 'none'> =
        feedbackLookup.items.length > 0 ? 'feedback' : 'expanded';

      const optionAPromise = searchService.hybrid({ query: trimmedQuery, top_k: topK });
      const optionBPromise = nextMode === 'feedback'
        ? queryFeedbackService.searchWithFeedback({
            query: trimmedQuery,
            top_k: topK,
            expansion_enabled: true,
            feedback_enabled: true,
            semantic_feedback_enabled: true,
            semantic_similarity_threshold: DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD,
          })
        : queryFeedbackService.search({
            query: trimmedQuery,
            top_k: topK,
            expansion_enabled: true,
          });

      const [optionAResponse, optionBResponse] = await Promise.all([optionAPromise, optionBPromise]);

      if (lastRequestIdRef.current !== requestId) {
        return false;
      }

      const normalizedOptionA = buildOption(
        'A',
        nextMode,
        'standard',
        normalizeHybridResults(optionAResponse.results),
      );

      const normalizedOptionB = buildOption(
        'B',
        nextMode,
        nextMode === 'feedback' ? 'feedback' : 'expanded',
        nextMode === 'feedback'
          ? normalizeFeedbackResults(optionBResponse.results)
          : normalizeExpandedResults(optionBResponse.results),
      );

      setComparisonMode(nextMode);
      setOptionA(normalizedOptionA);
      setOptionB(normalizedOptionB);
      setIsComparisonActive(true);
      setPreferenceSaved(false);
      return true;
    } catch (err) {
      if (lastRequestIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : 'No se pudo iniciar la comparación');
      }
      return false;
    } finally {
      if (lastRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [probability, resetComparison]);

  const savePreference = useCallback(async (preference: QueryFeedbackPreference) => {
    const query = currentQueryRef.current.trim();
    if (!query) {
      setError('No hay una comparación activa para guardar preferencia.');
      setPreferenceSaved(false);
      return;
    }

    setIsSavingPreference(true);
    setError(null);
    setPreferenceSaved(false);

    try {
      const candidates = preferenceTargets(preference, optionA, optionB);
      const deduped = new Map<string, { target: PreferenceTarget; relevance: QueryFeedbackRelevance; notes: string }>();

      candidates.forEach((candidate) => {
        deduped.set(candidate.target.chunk_id, candidate);
      });

      await Promise.all(
        Array.from(deduped.values()).map((candidate) =>
          queryFeedbackService.storeFeedback({
            query,
            chunk_id: candidate.target.chunk_id,
            source_id: candidate.target.source_id,
            relevance: candidate.relevance,
            notes: candidate.notes,
          }),
        ),
      );

      setPreferenceSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la preferencia');
      setPreferenceSaved(false);
      throw err;
    } finally {
      setIsSavingPreference(false);
    }
  }, [optionA, optionB]);

  return useMemo(() => ({
    isComparisonActive,
    comparisonMode,
    optionA,
    optionB,
    isLoading,
    isSavingPreference,
    preferenceSaved,
    error,
    startComparison,
    savePreference,
    resetComparison,
  }), [
    isComparisonActive,
    comparisonMode,
    optionA,
    optionB,
    isLoading,
    isSavingPreference,
    preferenceSaved,
    error,
    startComparison,
    savePreference,
    resetComparison,
  ]);
}
