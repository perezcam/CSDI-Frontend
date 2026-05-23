import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  AlertCircle,
  Info,
  Loader2,
  Save,
  Settings as SettingsIcon,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useConfig } from '../../hooks/useConfig';
import type { InsuffConfig, PipelineConfig, PipelineConfigUpdate } from '../../types/api';

export function Settings() {
  const { config, isLoading, isSaving, error, saveConfig } = useConfig();
  const [draft, setDraft] = useState<PipelineConfigUpdate | null>(null);

  useEffect(() => {
    if (!config) return;
    setDraft(toPipelineConfigUpdate(config));
  }, [config]);

  const modelOptions = useMemo(() => {
    const options = new Set<string>(config?.available_models ?? []);
    if (draft?.model) options.add(draft.model);
    return Array.from(options);
  }, [config?.available_models, draft?.model]);

  const vectorWeight = draft ? 1 - draft.bm25_weight : 0;
  const insuffWeightsTotal = draft
    ? draft.insuff.w_top
      + draft.insuff.w_quantity
      + draft.insuff.w_coverage
      + draft.insuff.w_diversity
      + draft.insuff.w_answerability
    : 0;

  const handleSave = async () => {
    if (!draft) return;

    const payload: PipelineConfigUpdate = {
      ...draft,
      bm25_weight: Number(draft.bm25_weight.toFixed(2)),
      vector_weight: Number(draft.vector_weight.toFixed(2)),
      temperature: Number(draft.temperature.toFixed(2)),
      query_feedback_comparison_probability: Number(
        draft.query_feedback_comparison_probability.toFixed(2),
      ),
      llm_base_url: draft.llm_base_url.trim(),
      llm_api_key: draft.llm_api_key.trim(),
      insuff: {
        ...draft.insuff,
        confidence_threshold: Number(draft.insuff.confidence_threshold.toFixed(4)),
        min_top_score: Number(draft.insuff.min_top_score.toFixed(4)),
        min_coverage_score: Number(draft.insuff.min_coverage_score.toFixed(4)),
        min_answerability_score: Number(draft.insuff.min_answerability_score.toFixed(4)),
        min_source_diversity: Number(draft.insuff.min_source_diversity.toFixed(4)),
        w_top: Number(draft.insuff.w_top.toFixed(4)),
        w_quantity: Number(draft.insuff.w_quantity.toFixed(4)),
        w_coverage: Number(draft.insuff.w_coverage.toFixed(4)),
        w_diversity: Number(draft.insuff.w_diversity.toFixed(4)),
        w_answerability: Number(draft.insuff.w_answerability.toFixed(4)),
      },
    };

    try {
      await saveConfig(payload);
      toast.success('Configuración guardada en el backend');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la configuración');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a]">
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="font-semibold text-white">Configuración</h1>
            <p className="text-sm text-slate-400">Administra todos los parámetros persistibles que el backend expone para retrieval, generación y evaluación de insuficiencia.</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isLoading || isSaving || !draft}
            className="bg-gradient-to-br from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white shadow-lg shadow-blue-900/30"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6 flex items-center gap-3 text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              Cargando configuración real del backend...
            </div>
          )}

          <SectionCard
            icon={<SlidersHorizontal className="w-5 h-5 text-blue-400" />}
            title="Pesos de Búsqueda Híbrida"
            tooltip="Controla el balance entre BM25 y búsqueda semántica vectorial. El backend exige que ambos pesos sumen 1.0."
          >
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-300">Peso BM25</Label>
                  <span className="text-sm font-semibold text-blue-400">
                    {draft ? `${(draft.bm25_weight * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
                <Slider
                  value={draft ? [draft.bm25_weight] : [0.3]}
                  onValueChange={(value) => {
                    const nextBm25 = Number(value[0].toFixed(2));
                    setDraft(current => current ? {
                      ...current,
                      bm25_weight: nextBm25,
                      vector_weight: Number((1 - nextBm25).toFixed(2)),
                    } : current);
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                  disabled={!draft}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MetricPill label="BM25" value={`${draft ? (draft.bm25_weight * 100).toFixed(0) : '0'}%`} />
                <MetricPill label="Vectorial" value={`${(vectorWeight * 100).toFixed(0)}%`} />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Sparkles className="w-5 h-5 text-blue-400" />}
            title="Modelo de Lenguaje"
            tooltip="Incluye conexión, modelo, temperatura y límites de salida persistidos por el backend."
          >
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-3 block">Proveedor Detectado</Label>
                <div className="w-full bg-[#1a2332] border border-[#2d3748] rounded-md px-3 py-2 text-white text-sm">
                  {config?.provider ?? '—'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="LLM Base URL"
                  value={draft?.llm_base_url ?? ''}
                  onChange={(value) => updateDraft(setDraft, 'llm_base_url', value)}
                  placeholder="https://api.groq.com/openai/v1"
                />
                <TextField
                  label="LLM API Key"
                  value={draft?.llm_api_key ?? ''}
                  onChange={(value) => updateDraft(setDraft, 'llm_api_key', value)}
                  placeholder="gsk_..."
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-300 mb-3 block">Selección de Modelo</Label>
                <Select
                  value={draft?.model ?? ''}
                  onValueChange={(value) => updateDraft(setDraft, 'model', value)}
                  disabled={!draft}
                >
                  <SelectTrigger className="w-full bg-[#1a2332] border-[#2d3748] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1419] border-[#2d3748]">
                    {modelOptions.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {modelOptions.length === 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    No hay catálogo local para este proveedor. Puedes escribir el endpoint y guardar con el nombre de modelo deseado.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-slate-300">Temperatura</Label>
                    <span className="text-sm font-semibold text-blue-400">{draft?.temperature.toFixed(2) ?? '—'}</span>
                  </div>
                  <Slider
                    value={draft ? [draft.temperature] : [0.1]}
                    onValueChange={(value) => updateDraft(setDraft, 'temperature', Number(value[0].toFixed(2)))}
                    min={0}
                    max={2}
                    step={0.05}
                    className="w-full"
                    disabled={!draft}
                  />
                </div>
                <NumberField
                  label="Max Tokens"
                  value={draft?.max_tokens ?? 1024}
                  min={64}
                  max={8192}
                  step={64}
                  onChange={(value) => updateDraft(setDraft, 'max_tokens', value)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<SettingsIcon className="w-5 h-5 text-blue-400" />}
            title="Retrieval y RAG"
            tooltip="Controles operativos del pipeline de recuperación y generación que hoy soporta el backend."
          >
            <div className="space-y-6">
              <ToggleRow
                title="Habilitar Reranker"
                description="Activa el reordenamiento con cross-encoder antes de generar la respuesta."
                checked={draft?.reranker_enabled ?? false}
                onCheckedChange={(checked) => updateDraft(setDraft, 'reranker_enabled', checked)}
              />

              <ToggleRow
                title="Habilitar HyDE"
                description="Activa HyDE: genera una hipótesis con el LLM para enriquecer la búsqueda semántica."
                checked={draft?.hyde_enabled ?? false}
                onCheckedChange={(checked) => updateDraft(setDraft, 'hyde_enabled', checked)}
              />

              <div className="rounded-lg border border-[#2d3748] bg-[#1a2332] p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-white">Retroalimentación de búsqueda</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Controla la frecuencia del flujo A/B que recopila preferencias del usuario y
                    permite reutilizar feedback histórico en búsquedas futuras. No modifica la
                    configuración de HyDE.
                  </p>
                </div>

                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <Label className="text-sm font-medium text-white">
                      Probabilidad de comparación A/B
                    </Label>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                      Define qué porcentaje de búsquedas elegibles mostrarán dos variantes de
                      resultados para que el usuario indique cuál fue más útil.
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-blue-400 whitespace-nowrap">
                    {draft
                      ? `${(draft.query_feedback_comparison_probability * 100).toFixed(0)}% · ${draft.query_feedback_comparison_probability.toFixed(2)}`
                      : '25% · 0.25'}
                  </span>
                </div>

                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft ? [draft.query_feedback_comparison_probability] : [0.25]}
                  disabled={!draft}
                  onValueChange={(value) => {
                    updateDraft(
                      setDraft,
                      'query_feedback_comparison_probability',
                      Number(value[0].toFixed(2)),
                    );
                  }}
                  className="w-full"
                />

                <div className="mt-3 text-xs text-slate-500">
                  0% nunca · 25% ocasional · 100% siempre/demo
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <NumberField
                  label="Chunks de contexto"
                  value={draft?.context_chunks ?? 15}
                  min={1}
                  max={50}
                  step={1}
                  onChange={(value) => updateDraft(setDraft, 'context_chunks', value)}
                />
                <NumberField
                  label="Candidate K reranker"
                  value={draft?.reranker_candidate_k ?? 30}
                  min={1}
                  max={200}
                  step={1}
                  onChange={(value) => updateDraft(setDraft, 'reranker_candidate_k', value)}
                />
                <NumberField
                  label="Peso vectorial"
                  value={draft?.vector_weight ?? 0.7}
                  disabled
                  onChange={() => undefined}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<ShieldAlert className="w-5 h-5 text-blue-400" />}
            title="Detector de Insuficiencia"
            tooltip="Estos umbrales definen cuándo la recuperación local se considera insuficiente. Cuando eso ocurre, el sistema puede orientar la consulta hacia búsqueda web."
          >
            <div className="space-y-6">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <p className="text-sm text-amber-100">
                  Esta sección controla cómo el sistema decide que la información recuperada no es suficiente.
                  Cuando el score de insuficiencia supera el umbral configurado, la aplicación puede orientar la respuesta hacia búsqueda web para ampliar cobertura y evidencia.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="Confidence threshold"
                  tooltip="Umbral final del score de insuficiencia. Si el sistema supera este valor, considera que la recuperación local no alcanza y puede orientar la respuesta hacia búsqueda web."
                  value={draft?.insuff.confidence_threshold ?? 0.65}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateInsuff(setDraft, 'confidence_threshold', value)}
                />
                <NumberField
                  label="Min top score"
                  tooltip="Puntaje mínimo esperado para el mejor resultado recuperado. Si el primer resultado cae por debajo de este valor, aumenta la señal de insuficiencia."
                  value={draft?.insuff.min_top_score ?? 0.35}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateInsuff(setDraft, 'min_top_score', value)}
                />
                <NumberField
                  label="Min results"
                  tooltip="Cantidad mínima de resultados recuperados que el sistema espera encontrar antes de considerar que la evidencia es demasiado escasa."
                  value={draft?.insuff.min_results ?? 5}
                  min={1}
                  step={1}
                  onChange={(value) => updateInsuff(setDraft, 'min_results', value)}
                />
                <NumberField
                  label="Expected results"
                  tooltip="Cantidad ideal de resultados útiles para una consulta. Se usa como referencia para medir cobertura frente a lo que realmente se recuperó."
                  value={draft?.insuff.expected_results ?? 10}
                  min={1}
                  step={1}
                  onChange={(value) => updateInsuff(setDraft, 'expected_results', value)}
                />
                <NumberField
                  label="Min relevant results"
                  tooltip="Cantidad mínima de resultados que deberían parecer realmente relevantes. Si hay menos que esto, el sistema interpreta que la respuesta puede ser insuficiente."
                  value={draft?.insuff.min_relevant_results ?? 2}
                  min={1}
                  step={1}
                  onChange={(value) => updateInsuff(setDraft, 'min_relevant_results', value)}
                />
                <NumberField
                  label="Coverage top N"
                  tooltip="Número de resultados iniciales que se analizan para medir cobertura y diversidad. Define cuántos elementos de la parte alta del ranking se toman en cuenta."
                  value={draft?.insuff.coverage_top_n ?? 5}
                  min={1}
                  step={1}
                  onChange={(value) => updateInsuff(setDraft, 'coverage_top_n', value)}
                />
                <NumberField
                  label="Min coverage score"
                  tooltip="Cobertura mínima aceptable del contexto recuperado. Si el contenido encontrado cubre demasiado poco de la necesidad informativa, sube la señal de insuficiencia."
                  value={draft?.insuff.min_coverage_score ?? 0.2}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateInsuff(setDraft, 'min_coverage_score', value)}
                />
                <NumberField
                  label="Min answerability score"
                  tooltip="Nivel mínimo de evidencia necesario para que el sistema considere que puede responder con seguridad sin salir a buscar más información."
                  value={draft?.insuff.min_answerability_score ?? 0.4}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateInsuff(setDraft, 'min_answerability_score', value)}
                />
                <NumberField
                  label="Min source diversity"
                  tooltip="Diversidad mínima de fuentes esperada en los resultados. Si casi todo proviene de un solo origen, el sistema puede considerar que falta amplitud y activar búsqueda web."
                  value={draft?.insuff.min_source_diversity ?? 0.3}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateInsuff(setDraft, 'min_source_diversity', value)}
                />
              </div>

              <div className="border-t border-[#1a2332] pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-white">Pesos del score de insuficiencia</h3>
                    <p className="text-xs text-slate-500 mt-1">Estos pesos determinan qué señales influyen más en la decisión de redirigir la consulta hacia búsqueda web. El backend valida que la suma sea exactamente 1.0.</p>
                  </div>
                  <span className={`text-sm font-semibold ${Math.abs(insuffWeightsTotal - 1) < 1e-4 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    Total {insuffWeightsTotal.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  <NumberField
                    label="w_top"
                    tooltip="Peso asignado a la calidad del mejor resultado recuperado dentro del score total de insuficiencia."
                    value={draft?.insuff.w_top ?? 0.1}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateInsuff(setDraft, 'w_top', value)}
                  />
                  <NumberField
                    label="w_quantity"
                    tooltip="Peso asignado a la cantidad de resultados recuperados respecto a la expectativa configurada."
                    value={draft?.insuff.w_quantity ?? 0.15}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateInsuff(setDraft, 'w_quantity', value)}
                  />
                  <NumberField
                    label="w_coverage"
                    tooltip="Peso asignado a la cobertura del contenido recuperado. Mientras más alto, más influye la falta de cobertura en activar búsqueda web."
                    value={draft?.insuff.w_coverage ?? 0.35}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateInsuff(setDraft, 'w_coverage', value)}
                  />
                  <NumberField
                    label="w_diversity"
                    tooltip="Peso asignado a la diversidad de fuentes encontradas dentro del score de insuficiencia."
                    value={draft?.insuff.w_diversity ?? 0.15}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateInsuff(setDraft, 'w_diversity', value)}
                  />
                  <NumberField
                    label="w_answerability"
                    tooltip="Peso asignado a la capacidad estimada de responder la consulta con el contexto local ya recuperado."
                    value={draft?.insuff.w_answerability ?? 0.25}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) => updateInsuff(setDraft, 'w_answerability', value)}
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  tooltip,
  children,
}: {
  icon: ReactNode;
  title: string;
  tooltip: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h2 className="font-semibold text-white">{title}</h2>
        <InfoTooltip text={tooltip} />
      </div>
      {children}
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-2">
      <Info className="w-4 h-4 text-slate-500 cursor-help" />
      <div className="invisible group-hover:visible absolute left-6 top-0 w-64 bg-[#0f1419] border border-[#2d3748] text-slate-300 text-xs rounded-lg p-3 z-10 shadow-xl">
        {text}
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1a2332] border border-[#2d3748] rounded-lg px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-slate-300 mb-3 block">{label}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1a2332] border-[#2d3748] text-white"
      />
    </div>
  );
}

function NumberField({
  label,
  tooltip,
  value,
  onChange,
  min,
  max,
  step,
  disabled,
}: {
  label: string;
  tooltip?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center mb-3">
        <Label className="text-sm font-medium text-slate-300">{label}</Label>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <Input
        type="number"
        value={Number.isFinite(value) ? String(value) : ''}
        onChange={(event) => {
          const nextValue = event.target.valueAsNumber;
          if (!Number.isNaN(nextValue)) onChange(nextValue);
        }}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full bg-[#1a2332] border-[#2d3748] text-white"
      />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#1a2332] border border-[#2d3748] rounded-lg">
      <div>
        <Label className="text-sm font-medium text-white">{title}</Label>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function toPipelineConfigUpdate(config: PipelineConfig): PipelineConfigUpdate {
  const { provider: _provider, available_models: _availableModels, ...rest } = config;
  return rest;
}

function updateDraft<K extends keyof PipelineConfigUpdate>(
  setDraft: Dispatch<SetStateAction<PipelineConfigUpdate | null>>,
  key: K,
  value: PipelineConfigUpdate[K],
) {
  setDraft(current => current ? { ...current, [key]: value } : current);
}

function updateInsuff<K extends keyof InsuffConfig>(
  setDraft: Dispatch<SetStateAction<PipelineConfigUpdate | null>>,
  key: K,
  value: InsuffConfig[K],
) {
  setDraft(current => current ? {
    ...current,
    insuff: {
      ...current.insuff,
      [key]: value,
    },
  } : current);
}
