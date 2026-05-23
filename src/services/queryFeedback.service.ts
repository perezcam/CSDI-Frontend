import { api } from '../lib/api';
import type {
  QueryFeedbackByQueryResponse,
  QueryFeedbackFeedbackRequest,
  QueryFeedbackFeedbackResponse,
  QueryFeedbackSearchRequest,
  QueryFeedbackSearchResponse,
  QueryFeedbackSearchWithFeedbackRequest,
  QueryFeedbackSearchWithFeedbackResponse,
  QueryFeedbackSummaryResponse,
} from '../types/api';

export const queryFeedbackService = {
  search: (body: QueryFeedbackSearchRequest) =>
    api.post<QueryFeedbackSearchResponse>('/api/v1/query-feedback/search', body),

  storeFeedback: (body: QueryFeedbackFeedbackRequest) =>
    api.post<QueryFeedbackFeedbackResponse>('/api/v1/query-feedback/feedback', body),

  searchWithFeedback: (body: QueryFeedbackSearchWithFeedbackRequest) =>
    api.post<QueryFeedbackSearchWithFeedbackResponse>(
      '/api/v1/query-feedback/search-with-feedback',
      body,
    ),

  summary: () =>
    api.get<QueryFeedbackSummaryResponse>('/api/v1/query-feedback/feedback/summary'),

  feedbackByQuery: (query: string, sessionId?: string) => {
    let path = `/api/v1/query-feedback/feedback?query=${encodeURIComponent(query)}`;
    if (sessionId) {
      path += `&session_id=${encodeURIComponent(sessionId)}`;
    }

    return api.get<QueryFeedbackByQueryResponse>(path);
  },
};
