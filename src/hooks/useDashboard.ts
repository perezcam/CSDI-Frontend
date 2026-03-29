import { useState, useEffect, useCallback } from 'react';
import { healthService } from '../services/health.service';

export type SystemHealth = 'healthy' | 'warning' | 'error';

export interface DashboardState {
  health: SystemHealth;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    health: 'healthy',
    isLoading: true,
    error: null,
    lastChecked: null,
  });

  const checkHealth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await healthService.check();
      setState({
        health: response.status === 'ok' ? 'healthy' : 'error',
        isLoading: false,
        error: null,
        lastChecked: new Date(),
      });
    } catch (err) {
      setState({
        health: 'error',
        isLoading: false,
        error: err instanceof Error ? err.message : 'No se pudo conectar al backend',
        lastChecked: new Date(),
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { ...state, refresh: checkHealth };
}
