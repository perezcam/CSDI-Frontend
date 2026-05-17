import { useState, useEffect, useCallback } from 'react';
import { configService } from '../services/config.service';
import type { PipelineConfig, PipelineConfigUpdate } from '../types/api';

const DEFAULT_INSUFF = {
  confidence_threshold: 0.55,
  min_results: 5,
  expected_results: 10,
  min_top_score: 0.35,
  min_relevant_results: 2,
  min_coverage_score: 0.20,
  min_answerability_score: 0.40,
  min_source_diversity: 0.30,
  coverage_top_n: 5,
  w_top: 0.25,
  w_quantity: 0.15,
  w_coverage: 0.25,
  w_diversity: 0.20,
  w_answerability: 0.15,
};

const DEFAULT_CONFIG: PipelineConfig = {
  bm25_weight: 0.3,
  vector_weight: 0.7,
  temperature: 0.1,
  model: '',
  reranker_enabled: true,
  reranker_candidate_k: 30,
  context_chunks: 15,
  max_tokens: 1024,
  hyde_enabled: false,
  llm_base_url: '',
  llm_api_key: '',
  provider: 'custom',
  available_models: [],
  insuff: DEFAULT_INSUFF,
};

export function useConfig() {
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configService.get();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (update: PipelineConfigUpdate) => {
    try {
      setSaving(true);
      setError(null);
      const updated = await configService.update(update);
      setConfig(updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { config, loading, saving, error, save, reload: load };
}
