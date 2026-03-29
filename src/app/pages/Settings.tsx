import { useState } from 'react';
import { Settings as SettingsIcon, Save, Info } from 'lucide-react';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

export function Settings() {
  // Hybrid weights
  const [bm25Weight, setBm25Weight] = useState([0.3]);
  const vectorWeight = 1 - bm25Weight[0];

  // LLM Settings
  const [llmModel, setLlmModel] = useState('gpt-4-turbo');
  const [temperature, setTemperature] = useState([0.7]);

  // Retrieval Settings
  const [rerankerEnabled, setRerankerEnabled] = useState(true);
  const [contextChunks, setContextChunks] = useState([5]);
  const [candidateK, setCandidateK] = useState([20]);

  const handleSave = () => {
    toast.success('Configuración guardada correctamente');
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
      {/* Header */}
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="font-semibold text-white">Configuración</h1>
            <p className="text-sm text-slate-400">Ajusta los parámetros del pipeline RAG</p>
          </div>
          <Button 
            onClick={handleSave} 
            className="bg-gradient-to-br from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white shadow-lg shadow-blue-900/30"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hybrid Search Weights */}
          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Pesos de Búsqueda Híbrida</h2>
              <InfoTooltip text="Controla el balance entre búsqueda basada en palabras clave (BM25) y semántica (vectores). La búsqueda híbrida combina ambos enfoques para mejores resultados." />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-300">Peso BM25</Label>
                  <span className="text-sm font-semibold text-blue-400">
                    {(bm25Weight[0] * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={bm25Weight}
                  onValueChange={setBm25Weight}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-300">Peso Vectorial</Label>
                  <span className="text-sm font-semibold text-blue-400">
                    {(vectorWeight * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-[#1a2332] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                    style={{ width: `${vectorWeight * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-blue-400">Modo actual: </span>
                  {bm25Weight[0] === 0 
                    ? 'Búsqueda Vectorial Pura' 
                    : bm25Weight[0] === 1 
                      ? 'Búsqueda BM25 Pura'
                      : 'Búsqueda Híbrida'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* LLM Configuration */}
          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Modelo de Lenguaje</h2>
              <InfoTooltip text="Selecciona el LLM para generar respuestas y ajusta la temperatura para controlar creatividad vs consistencia." />
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-3 block">Selección de Modelo</Label>
                <Select value={llmModel} onValueChange={setLlmModel}>
                  <SelectTrigger className="w-full bg-[#1a2332] border-[#2d3748] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1419] border-[#2d3748]">
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-300">Temperatura</Label>
                  <span className="text-sm font-semibold text-blue-400">
                    {temperature[0].toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">Más Preciso</span>
                  <span className="text-xs text-slate-500">Más Creativo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Retrieval Configuration */}
          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Configuración de Retrieval</h2>
              <InfoTooltip text="Ajusta cómo se recuperan y clasifican los documentos antes de enviarse al LLM." />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#1a2332] border border-[#2d3748] rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-white">Habilitar Reranker</Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Usar IA reranker para refinar resultados de búsqueda
                  </p>
                </div>
                <Switch
                  checked={rerankerEnabled}
                  onCheckedChange={setRerankerEnabled}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-300">Chunks de Contexto LLM</Label>
                  <span className="text-sm font-semibold text-blue-400">
                    {contextChunks[0]} chunks
                  </span>
                </div>
                <Slider
                  value={contextChunks}
                  onValueChange={setContextChunks}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Número de chunks superiores a incluir en el contexto del LLM
                </p>
              </div>

              {rerankerEnabled && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-slate-300">Pool de Candidatos Reranker</Label>
                    <span className="text-sm font-semibold text-blue-400">
                      {candidateK[0]} candidatos
                    </span>
                  </div>
                  <Slider
                    value={candidateK}
                    onValueChange={setCandidateK}
                    min={5}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Candidatos iniciales a recuperar antes del reranking
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Summary */}
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="font-semibold text-blue-300 mb-4">Pipeline Actual</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estrategia de Búsqueda:</span>
                <span className="font-medium text-white">
                  {bm25Weight[0] === 0 ? 'Solo Vector' : bm25Weight[0] === 1 ? 'Solo BM25' : 'Híbrido'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Retrieval Inicial:</span>
                <span className="font-medium text-white">
                  {candidateK[0]} candidatos
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reranking:</span>
                <span className="font-medium text-white">
                  {rerankerEnabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contexto Final:</span>
                <span className="font-medium text-white">
                  {contextChunks[0]} chunks a {llmModel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Temperatura:</span>
                <span className="font-medium text-white">
                  {temperature[0].toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
