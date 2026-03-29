import { api } from '../lib/api';
import type { HealthResponse } from '../types/api';

export const healthService = {
  check: () => api.get<HealthResponse>('/health'),
};
