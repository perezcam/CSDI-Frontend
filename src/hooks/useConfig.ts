import { useCallback, useEffect, useMemo, useState } from 'react';
import { configService, type PipelineConfigUpdate } from '../services/config.service';
import type { PipelineConfig } from '../types/api';

export function useConfig() {
  const [config, setConfig] = useState<PipelineConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await configService.get();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const saveConfig = useCallback(async (payload: PipelineConfigUpdate) => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await configService.update(payload);
      setConfig(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la configuración';
      setError(message);
      throw new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return useMemo(() => ({
    config,
    isLoading,
    isSaving,
    error,
    refetch: fetchConfig,
    saveConfig,
  }), [config, isLoading, isSaving, error, fetchConfig, saveConfig]);
}
