import { api } from '../lib/api';
import type { HealthResponse, MetricsResponse } from '../types/api';

export const healthService = {
  check: () => api.get<HealthResponse>('/health'),
  metrics: () => api.get<MetricsResponse>('/api/v1/metrics'),
};
