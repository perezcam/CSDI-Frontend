import { useCallback, useState } from 'react';
import { evaluationService } from '../services/evaluation.service';
import type {
  EvaluationJudgmentUpdateRequest,
  EvaluationQuery,
  EvaluationQueryCreateRequest,
  EvaluationRankingRunRequest,
  EvaluationRankingsResponse,
  EvaluationReport,
  EvaluationSummary,
} from '../types/api';

export function useEvaluation() {
  const [queries, setQueries] = useState<EvaluationQuery[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [evaluationRankings, setEvaluationRankings] = useState<EvaluationRankingsResponse | null>(null);
  const [judgments, setJudgments] = useState<Record<string, number>>({});
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningRankings, setIsRunningRankings] = useState(false);
  const [isRunningEvaluation, setIsRunningEvaluation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureError = (err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : fallback;
    setError(message);
    throw err;
  };

  const loadQueries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await evaluationService.listQueries();
      setQueries(data);
      setSelectedQueryId(prev => prev ?? data[0]?.id ?? null);
      return data;
    } catch (err) {
      captureError(err, 'No se pudieron cargar las consultas de evaluación');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const data = await evaluationService.getSummary();
      setSummary(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const loadReport = useCallback(async () => {
    try {
      const data = await evaluationService.getReport();
      setReport(data);
      return data;
    } catch {
      setReport(null);
      return null;
    }
  }, []);

  const selectQuery = useCallback(async (queryId: string) => {
    setSelectedQueryId(queryId);
    setError(null);
    try {
      const [rankings, judgmentData] = await Promise.all([
        evaluationService.getRankings(queryId).catch(() => null),
        evaluationService.getJudgments(queryId),
      ]);
      setEvaluationRankings(rankings);
      setJudgments(judgmentData.judgments);
    } catch (err) {
      captureError(err, 'No se pudo cargar la consulta de evaluación');
    }
  }, []);

  const createQuery = useCallback(async (body: EvaluationQueryCreateRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await evaluationService.createQuery(body);
      setQueries(prev => [...prev, created]);
      setSelectedQueryId(created.id);
      setEvaluationRankings(null);
      setJudgments({});
      await loadSummary();
      return created;
    } catch (err) {
      captureError(err, 'No se pudo guardar la consulta de evaluación');
    } finally {
      setIsLoading(false);
    }
  }, [loadSummary]);

  const runRankings = useCallback(async (queryId: string, body: EvaluationRankingRunRequest) => {
    setIsRunningRankings(true);
    setError(null);
    try {
      const rankings = await evaluationService.runRankings(queryId, body);
      setEvaluationRankings(rankings);
      const judgmentData = await evaluationService.getJudgments(queryId);
      setJudgments(judgmentData.judgments);
      await loadSummary();
      return rankings;
    } catch (err) {
      captureError(err, 'No se pudo ejecutar el ranking de evaluación');
    } finally {
      setIsRunningRankings(false);
    }
  }, [loadSummary]);

  const updateJudgment = useCallback(async (
    queryId: string,
    chunkId: string,
    body: EvaluationJudgmentUpdateRequest,
  ) => {
    setError(null);
    const previous = judgments[chunkId];
    setJudgments(prev => ({ ...prev, [chunkId]: body.relevance }));
    try {
      const updated = await evaluationService.updateJudgment(queryId, chunkId, body);
      setJudgments(prev => ({ ...prev, [chunkId]: updated.relevance }));
      setEvaluationRankings(prev => {
        if (!prev) return prev;
        const rankings = Object.fromEntries(
          Object.entries(prev.rankings).map(([strategy, items]) => [
            strategy,
            items.map(item => item.chunk_id === chunkId
              ? { ...item, current_relevance: updated.relevance }
              : item),
          ]),
        ) as EvaluationRankingsResponse['rankings'];
        return { ...prev, rankings };
      });
      await loadSummary();
      return updated;
    } catch (err) {
      setJudgments(prev => {
        const next = { ...prev };
        if (previous === undefined) delete next[chunkId];
        else next[chunkId] = previous;
        return next;
      });
      captureError(err, 'No se pudo guardar la relevancia');
    }
  }, [judgments, loadSummary]);

  const runEvaluation = useCallback(async (k: number) => {
    setIsRunningEvaluation(true);
    setError(null);
    try {
      const data = await evaluationService.runEvaluation({ k });
      setReport(data);
      await loadSummary();
      return data;
    } catch (err) {
      captureError(err, 'No se pudo ejecutar la evaluación');
    } finally {
      setIsRunningEvaluation(false);
    }
  }, [loadSummary]);

  return {
    queries,
    selectedQueryId,
    evaluationRankings,
    judgments,
    report,
    summary,
    isLoading,
    isRunningRankings,
    isRunningEvaluation,
    error,
    loadQueries,
    createQuery,
    selectQuery,
    runRankings,
    updateJudgment,
    runEvaluation,
    loadReport,
    loadSummary,
  };
}
