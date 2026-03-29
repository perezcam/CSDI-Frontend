import { Activity, Database, Cpu, Zap, Brain, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useDashboard } from '../../hooks/useDashboard';

// Static model info — sourced from backend defaults (no metrics endpoint yet)
const BACKEND_CONFIG = {
  embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
  llmModel: 'llama-3.3-70b-versatile (Groq)',
  rerankerModel: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
} as const;

export function Dashboard() {
  const { health, isLoading, error, lastChecked, refresh } = useDashboard();

  const healthColor = {
    healthy: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    warning:  'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    error:    'text-red-400 bg-red-500/20 border-red-500/30',
  }[health];

  const healthText = {
    healthy: 'Todos los Sistemas Operacionales',
    warning:  'Rendimiento Degradado',
    error:    'Backend no disponible',
  }[health];

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a]">
      {/* Header */}
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-white">Dashboard del Sistema</h1>
            <p className="text-sm text-slate-400">Monitorea la salud y rendimiento del motor RAG</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="bg-[#1a2332] border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* System Health */}
          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${healthColor} rounded-lg flex items-center justify-center border`}>
                  {isLoading
                    ? <Loader2 className="w-6 h-6 animate-spin" />
                    : <Activity className="w-6 h-6" />
                  }
                </div>
                <div>
                  <h2 className="font-semibold text-white">Estado del Sistema</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {isLoading ? 'Verificando conexión...' : healthText}
                  </p>
                  {lastChecked && (
                    <p className="text-xs text-slate-600 mt-1">
                      Último chequeo: {lastChecked.toLocaleTimeString('es-ES')}
                    </p>
                  )}
                </div>
              </div>
              {!isLoading && health === 'healthy' && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-emerald-400">En Vivo</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Index Metrics — pending a /api/v1/metrics endpoint in the backend */}
          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg divide-y divide-[#1a2332]">
            {[
              { icon: Database, label: 'Total Chunks' },
              { icon: Zap,      label: 'Vectores en FAISS' },
              { icon: Cpu,      label: 'Documentos BM25' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-400">{label}</span>
                </div>
                <span className="text-sm font-medium text-slate-600">— sin endpoint de métricas</span>
              </div>
            ))}
          </div>

          {/* Active Models */}
          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-[#1a2332] border-b border-[#2d3748]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold text-white">Modelos del Backend</h2>
              </div>
            </div>
            <div className="divide-y divide-[#1a2332]">
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Modelo de Embeddings</p>
                  <p className="text-xs text-slate-500 mt-1">Codificación vectorial para búsqueda semántica</p>
                </div>
                <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium border border-blue-500/30">
                  {BACKEND_CONFIG.embeddingModel}
                </div>
              </div>

              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Modelo de Lenguaje</p>
                  <p className="text-xs text-slate-500 mt-1">Generación de respuestas y síntesis</p>
                </div>
                <div className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-medium border border-cyan-500/30">
                  {BACKEND_CONFIG.llmModel}
                </div>
              </div>

              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Modelo Reranker</p>
                  <p className="text-xs text-slate-500 mt-1">Refinamiento de relevancia y ranking</p>
                </div>
                <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium border border-purple-500/30">
                  {BACKEND_CONFIG.rerankerModel}
                </div>
              </div>
            </div>
          </div>

          {/* Backend Info */}
          <div className="border border-[#1a2332] rounded-lg px-6 py-4">
            <p className="text-xs text-slate-500">
              <span className="text-slate-400 font-medium">Backend RAG Engine</span>
              {' · '}FastAPI · Puerto 8888 · PostgreSQL + pgvector · FAISS HNSW · BM25 + RRF Fusion
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Métricas disponibles al agregar <code className="text-slate-500">/api/v1/metrics</code> al backend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
