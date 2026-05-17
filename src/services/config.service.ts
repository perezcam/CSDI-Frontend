import { api } from '../lib/api';
import type { PipelineConfig, PipelineConfigUpdate } from '../types/api';

export const configService = {
  get: () => api.get<PipelineConfig>('/api/v1/config'),
  update: (body: PipelineConfigUpdate) => api.post<PipelineConfig>('/api/v1/config', body),
};
