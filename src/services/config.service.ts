import { api } from '../lib/api';
import type { PipelineConfig } from '../types/api';

export type PipelineConfigUpdate = Omit<PipelineConfig, 'provider' | 'available_models'>;

export const configService = {
  get: () => api.get<PipelineConfig>('/api/v1/config'),
  update: (body: PipelineConfigUpdate) => api.post<PipelineConfig>('/api/v1/config', body),
};
