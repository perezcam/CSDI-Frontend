import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Info, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { useConfig } from '../../hooks/useConfig';
import type { PipelineConfigUpdate, InsuffConfig } from '../../types/api';

function InfoTip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-2">
      <Info className="w-4 h-4 text-slate-500 cursor-help" />
      <div className="invisible group-hover:visible absolute left-6 top-0 w-72 bg-[#0f1419] border border-[#2d3748] text-slate-300 text-xs rounded-lg p-3 z-20 shadow-xl">
        {text}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        {icon ?? <SettingsIcon className="w-5 h-5 text-blue-400" />}
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function SliderRow({
  label, tip, value, onChange, min, max, step, unit = '', fmt,
}: {
  label: string; tip?: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit?: string; fmt?: (v: number) => string;
}) {
  const display = fmt ? fmt(value) : `${value}${unit}`;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Label className="text-sm font-medium text-slate-300">{label}</Label>
          {tip && <InfoTip text={tip} />}
        </div>
        <span className="text-sm font-semibold text-blue-400">{display}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="w-full" />
    </div>
  );
}

function ToggleRow({ label, tip, checked, onChange, description }: {
  label: string; tip?: string; checked: boolean; onChange: (v: boolean) => void; description?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#1a2332] border border-[#2d3748] rounded-lg">
      <div>
        <div className="flex items-center">
          <Label className="text-sm font-medium text-white">{label}</Label>
          {tip && <InfoTip text={tip} />}
        </div>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function Settings() {
  const { config, loading, saving, error: loadError, save, reload } = useConfig();

  const [bm25Weight, setBm25Weight] = useState(0.3);
  const [temperature, setTemperature] = useState(0.1);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [contextChunks, setContextChunks] = useState(15);
  const [model, setModel] = useState('');
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [rerankerEnabled, setRerankerEnabled] = useState(true);
  const [rerankerCandidateK, setRerankerCandidateK] = useState(30);
  const [hydeEnabled, setHydeEnabled] = useState(false);
  const [insuff, setInsuff] = useState<InsuffConfig>(config.insuff);
  const [showWeights, setShowWeights] = useState(false);

  useEffect(() => {
    if (!loading) {
      setBm25Weight(config.bm25_weight);
      setTemperature(config.temperature);
      setMaxTokens(config.max_tokens);
      setContextChunks(config.context_chunks);
      setModel(config.model);
      setLlmBaseUrl(config.llm_base_url);
      setLlmApiKey(config.llm_api_key);
      setRerankerEnabled(config.reranker_enabled);
      setRerankerCandidateK(config.reranker_candidate_k);
      setHydeEnabled(config.hyde_enabled);
      setInsuff(config.insuff);
    }
  }, [loading, config]);

  const weightSum = insuff.w_top + insuff.w_quantity + insuff.w_coverage + insuff.w_diversity + insuff.w_answerability;
  const weightsValid = Math.abs(weightSum - 1.0) < 1e-4;

  const patchInsuff = (patch: Partial<InsuffConfig>) => setInsuff(prev => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!weightsValid) {
      toast.error(`Los pesos del detector deben sumar 1.0 (actual: ${weightSum.toFixed(3)})`);
      return;
    }
    const payload: PipelineConfigUpdate = {
      bm25_weight: bm25Weight,
      vector_weight: parseFloat((1 - bm25Weight).toFixed(6)),
      temperature,
      model,
      reranker_enabled: rerankerEnabled,
      reranker_candidate_k: rerankerCandidateK,
      context_chunks: contextChunks,
      max_tokens: maxTokens,
      hyde_enabled: hydeEnabled,
      llm_base_url: llmBaseUrl,
      llm_api_key: llmApiKey,
      insuff,
    };
    const ok = await save(payload);
    if (ok) toast.success('Configuración guardada y aplicada al pipeline');
    else toast.error('Error al guardar la configuración');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a]">
      {/* Header */}
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="font-semibold text-white">Configuración</h1>
            <p className="text-sm text-slate-400">Ajusta los parámetros del pipeline RAG en tiempo real</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reload} className="border-[#2d3748] text-slate-300 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-br from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white shadow-lg shadow-blue-900/30">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {loadError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{loadError}</p>
            </div>
          )}

          {/* LLM */}
          <Section title="Modelo de Lenguaje (LLM)">
            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">URL del proveedor</Label>
              <Input
                value={llmBaseUrl}
                onChange={e => setLlmBaseUrl(e.target.value)}
                className="bg-[#1a2332] border-[#2d3748] text-white"
                placeholder="https://api.mistral.ai/v1"
              />
              <p className="text-xs text-slate-500 mt-1">Compatible con OpenAI, Mistral, Groq, Ollama, Gemini</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">API Key</Label>
              <Input
                type="password"
                value={llmApiKey}
                onChange={e => setLlmApiKey(e.target.value)}
                className="bg-[#1a2332] border-[#2d3748] text-white"
                placeholder="sk-..."
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">Modelo</Label>
              <Input
                value={model}
                onChange={e => setModel(e.target.value)}
                className="bg-[#1a2332] border-[#2d3748] text-white"
                placeholder="mistral-small-latest"
              />
              {config.available_models.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.available_models.map(m => (
                    <button key={m} onClick={() => setModel(m)}
                      className={`text-xs px-2 py-1 rounded border transition-all ${model === m ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-[#1a2332] border-[#2d3748] text-slate-400 hover:text-slate-200'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <SliderRow label="Temperatura" tip="0 = respuestas deterministas y precisas. 1 = más variedad y creatividad." value={temperature} onChange={setTemperature} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
            <SliderRow label="Tokens máximos" tip="Longitud máxima de la respuesta generada." value={maxTokens} onChange={setMaxTokens} min={128} max={4096} step={128} unit=" tok" />
            <SliderRow label="Chunks de contexto" tip="Cantidad de fragmentos del corpus que se envían al LLM para generar la respuesta." value={contextChunks} onChange={setContextChunks} min={1} max={30} step={1} unit=" chunks" />
          </Section>

          {/* Hybrid weights */}
          <Section title="Pesos de Búsqueda Híbrida">
            <SliderRow
              label="Peso BM25 (léxico)"
              tip="Mayor peso BM25 → el sistema favorece coincidencias exactas de palabras clave. Mayor peso vectorial → el sistema favorece similitud semántica."
              value={bm25Weight}
              onChange={setBm25Weight}
              min={0} max={1} step={0.05}
              fmt={v => `${(v * 100).toFixed(0)}% BM25 / ${((1 - v) * 100).toFixed(0)}% Vectorial`}
            />
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-slate-300">
              <span className="font-medium text-blue-400">Modo: </span>
              {bm25Weight === 0 ? 'Solo Vectorial' : bm25Weight === 1 ? 'Solo BM25' : 'Híbrido (RRF)'}
            </div>
          </Section>

          {/* Retrieval */}
          <Section title="Retrieval y Reranker">
            <ToggleRow
              label="Habilitar Reranker"
              tip="Cross-encoder de segunda etapa que mejora la precisión re-clasificando los candidatos. Más lento pero significativamente más preciso."
              checked={rerankerEnabled}
              onChange={setRerankerEnabled}
              description="Usa cross-encoder/ms-marco para refinar el ranking"
            />
            {rerankerEnabled && (
              <SliderRow label="Pool de candidatos" tip="El reranker recibe este número de candidatos y selecciona los mejores." value={rerankerCandidateK} onChange={setRerankerCandidateK} min={5} max={100} step={5} unit=" candidatos" />
            )}
            <ToggleRow
              label="HyDE — Expansión de consulta"
              tip="El LLM genera un párrafo hipotético que respondería la pregunta, y ese párrafo se embebe para la búsqueda vectorial. Mejora resultados para consultas cortas."
              checked={hydeEnabled}
              onChange={setHydeEnabled}
              description="Hypothetical Document Embeddings — requiere una llamada LLM extra por consulta"
            />
          </Section>

          {/* Insufficiency detector */}
          <Section title="Detección de Insuficiencia (Búsqueda Web)">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-200">
              <p>Cuando la confianza del sistema en los resultados del corpus está por debajo del <strong>umbral</strong>, se activa la búsqueda web automáticamente.</p>
            </div>

            <SliderRow
              label="Umbral de confianza"
              tip="Si la puntuación de suficiencia calculada está por debajo de este valor, se dispara la búsqueda web. Valores altos = el sistema busca en web más frecuentemente."
              value={insuff.confidence_threshold}
              onChange={v => patchInsuff({ confidence_threshold: v })}
              min={0} max={1} step={0.05}
              fmt={v => `${(v * 100).toFixed(0)}%`}
            />

            <div className="grid grid-cols-2 gap-4">
              <SliderRow label="Resultados mínimos" tip="Si hay menos resultados que este valor, se considera insuficiente." value={insuff.min_results} onChange={v => patchInsuff({ min_results: v })} min={1} max={20} step={1} unit=" chunks" />
              <SliderRow label="Resultados esperados" tip="Cantidad óptima de resultados. Afecta el score de cantidad." value={insuff.expected_results} onChange={v => patchInsuff({ expected_results: v })} min={1} max={30} step={1} unit=" chunks" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SliderRow label="Score mínimo (top)" tip="Puntaje mínimo normalizado del mejor resultado. Si el top chunk no alcanza este umbral, se considera baja relevancia." value={insuff.min_top_score} onChange={v => patchInsuff({ min_top_score: v })} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
              <SliderRow label="Resultados relevantes mínimos" tip="Cuántos chunks deben tener overlap suficiente con la consulta para considerarlos relevantes." value={insuff.min_relevant_results} onChange={v => patchInsuff({ min_relevant_results: v })} min={1} max={10} step={1} unit=" chunks" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <SliderRow label="Cobertura mínima" tip="Proporción mínima de términos de la consulta que deben aparecer en los top chunks." value={insuff.min_coverage_score} onChange={v => patchInsuff({ min_coverage_score: v })} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
              <SliderRow label="Respondibilidad mínima" tip="Score combinado de cobertura + cantidad de chunks relevantes." value={insuff.min_answerability_score} onChange={v => patchInsuff({ min_answerability_score: v })} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
              <SliderRow label="Diversidad mínima" tip="Proporción mínima de fuentes únicas. Evita que todos los chunks vengan del mismo documento." value={insuff.min_source_diversity} onChange={v => patchInsuff({ min_source_diversity: v })} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
            </div>

            <SliderRow label="Top N para cobertura" tip="Cuántos de los mejores chunks se analizan al calcular la cobertura de términos." value={insuff.coverage_top_n} onChange={v => patchInsuff({ coverage_top_n: v })} min={1} max={15} step={1} unit=" chunks" />

            {/* Weights collapsible */}
            <div>
              <button
                onClick={() => setShowWeights(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showWeights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Pesos de métricas (avanzado)
                <span className={`text-xs px-2 py-0.5 rounded ${weightsValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  Σ = {weightSum.toFixed(3)}
                </span>
              </button>

              {showWeights && (
                <div className="mt-4 space-y-4 pl-2 border-l border-[#2d3748]">
                  <p className="text-xs text-slate-500">Los pesos controlan cuánto contribuye cada métrica al score de suficiencia. Deben sumar 1.0.</p>
                  {!weightsValid && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-300">
                      Los pesos suman {weightSum.toFixed(3)} — deben sumar exactamente 1.0 para guardar.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <SliderRow label="W top score" value={insuff.w_top} onChange={v => patchInsuff({ w_top: v })} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
                    <SliderRow label="W cantidad" value={insuff.w_quantity} onChange={v => patchInsuff({ w_quantity: v })} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
                    <SliderRow label="W cobertura" value={insuff.w_coverage} onChange={v => patchInsuff({ w_coverage: v })} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
                    <SliderRow label="W diversidad" value={insuff.w_diversity} onChange={v => patchInsuff({ w_diversity: v })} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
                    <SliderRow label="W respondibilidad" value={insuff.w_answerability} onChange={v => patchInsuff({ w_answerability: v })} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} />
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Summary */}
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="font-semibold text-blue-300 mb-4">Pipeline Actual</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {[
                ['LLM', model || '—'],
                ['Proveedor', config.provider],
                ['Temperatura', temperature.toFixed(2)],
                ['Tokens máx', `${maxTokens}`],
                ['Contexto', `${contextChunks} chunks`],
                ['Estrategia', bm25Weight === 0 ? 'Solo Vector' : bm25Weight === 1 ? 'Solo BM25' : 'Híbrido RRF'],
                ['BM25 / Vector', `${(bm25Weight * 100).toFixed(0)}% / ${((1 - bm25Weight) * 100).toFixed(0)}%`],
                ['Reranker', rerankerEnabled ? `Sí (k=${rerankerCandidateK})` : 'No'],
                ['HyDE', hydeEnabled ? 'Habilitado' : 'Deshabilitado'],
                ['Web search threshold', `${(insuff.confidence_threshold * 100).toFixed(0)}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-400">{k}:</span>
                  <span className="font-medium text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
