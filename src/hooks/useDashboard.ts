import { useState, useEffect, useCallback } from 'react';
import { configService } from '../services/config.service';
import { healthService } from '../services/health.service';
import { metricsService } from '../services/metrics.service';
import type { MetricsResponse, PipelineConfig } from '../types/api';

export type SystemHealth = 'healthy' | 'warning' | 'error';

export interface DashboardState {
  health: SystemHealth;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
  metrics: MetricsResponse | null;
  config: PipelineConfig | null;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    health: 'healthy',
    isLoading: true,
    error: null,
    lastChecked: null,
    metrics: null,
    config: null,
  });

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const [healthResponse, metricsResponse, configResponse] = await Promise.all([
        healthService.check(),
        metricsService.get(),
        configService.get(),
      ]);
      setState({
        health: healthResponse.status === 'ok' ? 'healthy' : 'error',
        isLoading: false,
        error: null,
        lastChecked: new Date(),
        metrics: metricsResponse,
        config: configResponse,
      });
    } catch (err) {
      setState({
        health: 'error',
        isLoading: false,
        error: err instanceof Error ? err.message : 'No se pudo conectar al backend',
        lastChecked: new Date(),
        metrics: null,
        config: null,
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { ...state, refresh: checkHealth };
}
