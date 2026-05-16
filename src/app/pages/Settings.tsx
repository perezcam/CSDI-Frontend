import { useEffect, useMemo, useState } from 'react';
import { Settings as SettingsIcon, Save, Info, AlertCircle, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { useConfig } from '../../hooks/useConfig';

export function Settings() {
  const { config, isLoading, isSaving, error, saveConfig } = useConfig();

  const [bm25Weight, setBm25Weight] = useState([0.3]);
  const [llmModel, setLlmModel] = useState('llama-3.3-70b-versatile');
  const [llmBaseUrl, setLlmBaseUrl] = useState('https://api.groq.com/openai/v1');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [temperature, setTemperature] = useState([0.1]);
  const [rerankerEnabled, setRerankerEnabled] = useState(true);
  const [contextChunks, setContextChunks] = useState([5]);
  const [candidateK, setCandidateK] = useState([20]);

  useEffect(() => {
    if (!config) return;
    setBm25Weight([config.bm25_weight]);
    setLlmModel(config.model);
    setLlmBaseUrl(config.llm_base_url);
    setLlmApiKey(config.llm_api_key);
    setTemperature([config.temperature]);
    setRerankerEnabled(config.reranker_enabled);
  }, [config]);

  const modelOptions = useMemo(() => {
    const set = new Set<string>(config?.available_models ?? []);
    if (llmModel) set.add(llmModel);
    return Array.from(set);
  }, [config?.available_models, llmModel]);

  const vectorWeight = 1 - bm25Weight[0];

  const handleSave = async () => {
    const payload = {
      bm25_weight: Number(bm25Weight[0].toFixed(2)),
      vector_weight: Number(vectorWeight.toFixed(2)),
      temperature: Number(temperature[0].toFixed(2)),
      model: llmModel,
      reranker_enabled: rerankerEnabled,
      llm_base_url: llmBaseUrl.trim(),
      llm_api_key: llmApiKey.trim(),
    };

    try {
      await saveConfig(payload);
      toast.success('Configuración guardada en el backend');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la configuración');
    }
  };

  const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2">
      <Info className="w-4 h-4 text-slate-500 cursor-help" />
      <div className="invisible group-hover:visible absolute left-6 top-0 w-64 bg-[#0f1419] border border-[#2d3748] text-slate-300 text-xs rounded-lg p-3 z-10 shadow-xl">
        {text}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a]">
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="font-semibold text-white">Configuración</h1>
            <p className="text-sm text-slate-400">Ajusta los parámetros del pipeline RAG</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isLoading || isSaving || !config}
            className="bg-gradient-to-br from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white shadow-lg shadow-blue-900/30"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
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

          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Pesos de Búsqueda Híbrida</h2>
              <InfoTooltip text="Controla el balance entre BM25 y búsqueda semántica vectorial." />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-300">Peso BM25</Label>
                  <span className="text-sm font-semibold text-blue-400">{(bm25Weight[0] * 100).toFixed(0)}%</span>
                </div>
                <Slider value={bm25Weight} onValueChange={setBm25Weight} min={0} max={1} step={0.05} className="w-full" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-300">Peso Vectorial</Label>
                  <span className="text-sm font-semibold text-blue-400">{(vectorWeight * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-[#1a2332] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${vectorWeight * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Modelo de Lenguaje</h2>
              <InfoTooltip text="La lista de modelos viene del proveedor activo (Groq/Ollama/OpenAI/custom)." />
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-3 block">Proveedor Detectado</Label>
                <div className="w-full bg-[#1a2332] border border-[#2d3748] rounded-md px-3 py-2 text-white text-sm">
                  {config?.provider ?? '—'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-300 mb-3 block">LLM Base URL</Label>
                <Input
                  value={llmBaseUrl}
                  onChange={(e) => setLlmBaseUrl(e.target.value)}
                  placeholder="https://api.groq.com/openai/v1"
                  className="w-full bg-[#1a2332] border-[#2d3748] text-white"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-300 mb-3 block">LLM API Key</Label>
                <Input
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full bg-[#1a2332] border-[#2d3748] text-white"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-300 mb-3 block">Selección de Modelo</Label>
                <Select value={llmModel} onValueChange={setLlmModel}>
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
                    No hay catálogo para este proveedor. Escribe base URL/API key y guarda.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-300">Temperatura</Label>
                  <span className="text-sm font-semibold text-blue-400">{temperature[0].toFixed(2)}</span>
                </div>
                <Slider value={temperature} onValueChange={setTemperature} min={0} max={1} step={0.05} className="w-full" />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">Más Preciso</span>
                  <span className="text-xs text-slate-500">Más Creativo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Configuración de Retrieval</h2>
              <InfoTooltip text="Reranker se persiste en backend. contextChunks y candidateK son visuales por ahora." />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#1a2332] border border-[#2d3748] rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-white">Habilitar Reranker</Label>
                  <p className="text-xs text-slate-500 mt-1">Usar modelo de reranking para refinar resultados</p>
                </div>
                <Switch checked={rerankerEnabled} onCheckedChange={setRerankerEnabled} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-300">Chunks de Contexto LLM</Label>
                  <span className="text-sm font-semibold text-blue-400">{contextChunks[0]} chunks</span>
                </div>
                <Slider value={contextChunks} onValueChange={setContextChunks} min={1} max={10} step={1} className="w-full" />
              </div>

              {rerankerEnabled && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-slate-300">Pool de Candidatos Reranker</Label>
                    <span className="text-sm font-semibold text-blue-400">{candidateK[0]} candidatos</span>
                  </div>
                  <Slider value={candidateK} onValueChange={setCandidateK} min={5} max={50} step={5} className="w-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
