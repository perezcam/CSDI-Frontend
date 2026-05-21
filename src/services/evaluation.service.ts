import { api } from '../lib/api';
import type {
  EvaluationJudgmentResponse,
  EvaluationJudgmentUpdateRequest,
  EvaluationJudgmentsResponse,
  EvaluationQuery,
  EvaluationQueryCreateRequest,
  EvaluationRankingRunRequest,
  EvaluationRankingsResponse,
  EvaluationReport,
  EvaluationSummary,
} from '../types/api';

export const evaluationService = {
  listQueries: () =>
    api.get<EvaluationQuery[]>('/api/v1/evaluation/queries'),

  createQuery: (body: EvaluationQueryCreateRequest) =>
    api.post<EvaluationQuery>('/api/v1/evaluation/queries', body),

  runRankings: (queryId: string, body: EvaluationRankingRunRequest) =>
    api.post<EvaluationRankingsResponse>(`/api/v1/evaluation/queries/${queryId}/rankings`, body),

  getRankings: (queryId: string) =>
    api.get<EvaluationRankingsResponse>(`/api/v1/evaluation/queries/${queryId}/rankings`),

  updateJudgment: (
    queryId: string,
    chunkId: string,
    body: EvaluationJudgmentUpdateRequest,
  ) =>
    api.put<EvaluationJudgmentResponse>(
      `/api/v1/evaluation/queries/${queryId}/judgments/${encodeURIComponent(chunkId)}`,
      body,
    ),

  getJudgments: (queryId: string) =>
    api.get<EvaluationJudgmentsResponse>(`/api/v1/evaluation/queries/${queryId}/judgments`),

  runEvaluation: (body: { k: number }) =>
    api.post<EvaluationReport>('/api/v1/evaluation/run', body),

  getReport: () =>
    api.get<EvaluationReport>('/api/v1/evaluation/report'),

  getSummary: () =>
    api.get<EvaluationSummary>('/api/v1/evaluation/summary'),
};
