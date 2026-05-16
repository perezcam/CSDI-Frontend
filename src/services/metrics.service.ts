import { api } from '../lib/api';
import type { MetricsResponse } from '../types/api';

export const metricsService = {
  get: () => api.get<MetricsResponse>('/api/v1/metrics'),
};
