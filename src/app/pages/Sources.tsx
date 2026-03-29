import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, FileText, Package, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useSources, type IngestStatus } from '../../hooks/useSources';

export function Sources() {
  const { sources, isLoading, error, ingest, refetch } = useSources();
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusIcon = (status: IngestStatus) => {
    switch (status) {
      case 'idle':      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'ingesting': return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error':     return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusBadge = (status: IngestStatus) => {
    switch (status) {
      case 'idle':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Configurado</Badge>;
      case 'ingesting':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Indexando</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Listo</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
    }
  };

  const filteredSources = sources.filter(s =>
    s.source_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalChunksIndexed = sources.reduce(
    (acc, s) => acc + (s.lastReport?.chunksIndexed ?? 0),
    0,
  );

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a]">
      {/* Header */}
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-white">Fuentes de Conocimiento</h1>
            <p className="text-sm text-slate-400">Gestiona tus colecciones de documentos indexados</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="bg-[#1a2332] border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-[#1a2332] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">Total Fuentes</span>
            <span className="text-sm font-semibold text-white">{sources.length}</span>
          </div>
          <div className="w-px h-4 bg-[#1a2332]" />
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">Fuentes Listas</span>
            <span className="text-sm font-semibold text-white">
              {sources.filter(s => s.ingestStatus === 'completed').length}
            </span>
          </div>
          <div className="w-px h-4 bg-[#1a2332]" />
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">Chunks Indexados</span>
            <span className="text-sm font-semibold text-white">
              {totalChunksIndexed > 0 ? totalChunksIndexed.toLocaleString() : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar fuentes..."
            className="max-w-md bg-[#1a2332] border-[#2d3748] text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Cargando fuentes...</p>
            </div>
          ) : (
            <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#1a2332] border-b border-[#2d3748]">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fuente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">URL Base</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Última Ingestión</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2332]">
                  {filteredSources.map((source) => (
                    <tr key={source.source_id} className="hover:bg-[#1a2332]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(source.ingestStatus)}
                          <div>
                            <p className="font-medium text-white">{source.source_id}</p>
                            <p className="text-xs text-slate-500">{source.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={source.base_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{source.base_url}</span>
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(source.ingestStatus)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {source.lastIngest
                          ? source.lastIngest.toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => ingest(source.source_id)}
                          disabled={source.ingestStatus === 'ingesting'}
                          className="bg-[#1a2332] border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
                        >
                          <RefreshCw
                            className={`w-4 h-4 mr-2 ${source.ingestStatus === 'ingesting' ? 'animate-spin' : ''}`}
                          />
                          Ingerir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSources.length === 0 && !isLoading && (
                <div className="text-center py-12 text-slate-500">
                  {sources.length === 0
                    ? 'No hay fuentes configuradas en el backend'
                    : `No se encontraron fuentes que coincidan con "${searchTerm}"`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
