import { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/health.service';
import type { MetricsResponse } from '../types/api';

export type SystemHealth = 'healthy' | 'warning' | 'error';

export interface DashboardState {
  health: SystemHealth;
  metrics: MetricsResponse | null;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    health: 'healthy',
    metrics: null,
    isLoading: true,
    error: null,
    lastChecked: null,
  });

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        healthService.check(),
        healthService.metrics(),
      ]);
      setState({
        health: healthResponse.status === 'ok' ? 'healthy' : 'error',
        metrics: metricsResponse,
        isLoading: false,
        error: null,
        lastChecked: new Date(),
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        health: 'error',
        isLoading: false,
        error: err instanceof Error ? err.message : 'No se pudo conectar al backend',
        lastChecked: new Date(),
      }));
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { ...state, refresh: checkHealth };
}
