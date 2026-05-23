import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, FileText, Package, Globe, BookOpen, User, Files, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { useSources, type IngestStatus } from '../../hooks/useSources';
import { metricsService } from '../../services/metrics.service';

const getSourceTypeBadge = (kind?: string) => {
  if (kind === 'url_manual') {
    return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">URL Manual</Badge>;
  }
  if (kind === 'upload_file') {
    return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Archivo Subido</Badge>;
  }
  return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">Configurada</Badge>;
};

const getStatusIcon = (status: IngestStatus) => {
  switch (status) {
    case 'idle':      return <CheckCircle2 className="w-5 h-5 text-slate-500" />;
    case 'crawling':  return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />;
    case 'indexing':  return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'error':     return <AlertCircle className="w-5 h-5 text-red-400" />;
  }
};

const getStatusBadge = (status: IngestStatus, pct: number) => {
  switch (status) {
    case 'idle':
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Configurado</Badge>;
    case 'crawling':
      return (
        <div className="flex flex-col gap-1 min-w-[120px]">
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Rastreando…</Badge>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-3/5 bg-yellow-500 rounded-full animate-pulse" />
          </div>
        </div>
      );
    case 'indexing':
      return (
        <div className="flex flex-col gap-1 min-w-[120px]">
          <div className="flex items-center justify-between">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Indexando</Badge>
            <span className="text-xs text-blue-400 font-mono">{pct.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    case 'completed':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Listo</Badge>;
    case 'error':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
  }
};

interface SourcesTableProps {
  sources: ReturnType<typeof useSources>['sources'];
  ingest: (id: string) => void;
  deindex: (id: string) => void;
  isIngesting: (status: IngestStatus) => boolean;
  hideIngestAction?: boolean;
}

function SourcesTable({ sources, ingest, deindex, isIngesting, hideIngestAction }: SourcesTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const confirmingSource = sources.find(s => s.source_id === confirmingId);

  return (
    <>
      <table className="w-full">
        <thead className="bg-[#1a2332] border-b border-[#2d3748]">
          <tr>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fuente</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">URL Base</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Chunks</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Última Ingestión</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a2332]">
          {sources.map((source) => (
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
                {getSourceTypeBadge(source.source_kind)}
              </td>
              <td className="px-6 py-4">
                {source.base_url.startsWith('http') ? (
                  <a
                    href={source.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{source.base_url}</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">{source.base_url}</span>
                )}
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(source.ingestStatus, source.progressPct ?? 0)}
              </td>
              <td className="px-6 py-4 text-slate-300 text-sm">
                {source.indexed_chunks.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-slate-400 text-sm">
                {source.lastIngest
                  ? source.lastIngest.toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  {!hideIngestAction && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ingest(source.source_id)}
                      disabled={isIngesting(source.ingestStatus)}
                      className="bg-[#1a2332] border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${isIngesting(source.ingestStatus) ? 'animate-spin' : ''}`}
                      />
                      Ingerir
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmingId(source.source_id)}
                    disabled={isIngesting(source.ingestStatus) || source.indexed_chunks === 0}
                    className="bg-[#1a2332] border-[#2d3748] text-slate-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AlertDialog open={confirmingId !== null} onOpenChange={(open) => { if (!open) setConfirmingId(null); }}>
        <AlertDialogContent className="bg-[#0f1419] border-[#2d3748] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar datos de esta fuente?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Se eliminarán todos los chunks, vectores y documentos de{' '}
              <span className="text-white font-medium">{confirmingSource?.name ?? confirmingId}</span>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmingId(null)}
              className="bg-[#1a2332] border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deindex(confirmingId!); setConfirmingId(null); }}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function Sources() {
  const { sources, isLoading, error, ingest, deindex, refetch } = useSources();
  const [searchTerm, setSearchTerm] = useState('');
  const [docCount, setDocCount] = useState<number | null>(null);

  useEffect(() => {
    metricsService.get()
      .then(m => setDocCount(m.total_documents))
      .catch(() => setDocCount(null));
  }, []);

  // Refresh doc count whenever sources change (after an ingest completes)
  useEffect(() => {
    if (!isLoading) {
      metricsService.get()
        .then(m => setDocCount(m.total_documents))
        .catch(() => {});
    }
  }, [isLoading]);

  const filteredSources = sources.filter(s =>
    s.source_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const corpusSources = filteredSources.filter(
    s => !s.source_kind || s.source_kind === 'configured',
  );
  const userSources = filteredSources.filter(
    s => s.source_kind === 'url_manual' || s.source_kind === 'upload_file',
  );

  const totalChunksIndexed = sources.reduce((acc, s) => acc + (s.indexed_chunks ?? 0), 0);
  const readySources = sources.filter(s => s.indexed_chunks > 0).length;
  const isIngesting = (status: IngestStatus) => status === 'crawling' || status === 'indexing';

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
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-slate-400">Fuentes Listas</span>
            <span className="text-sm font-semibold text-white">{readySources}</span>
          </div>
          <div className="w-px h-4 bg-[#1a2332]" />
          <div className="flex items-center gap-3">
            <Files className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-400">Documentos</span>
            <span className="text-sm font-semibold text-white">
              {docCount !== null ? docCount.toLocaleString() : '—'}
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

      {/* Tables */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
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
            <>
              {/* Corpus de Conocimiento */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Corpus de Conocimiento
                  </h2>
                  <span className="text-xs text-slate-500">({corpusSources.length})</span>
                </div>
                <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
                  {corpusSources.length > 0 ? (
                    <SourcesTable
                      sources={corpusSources}
                      ingest={ingest}
                      deindex={deindex}
                      isIngesting={isIngesting}
                    />
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      {searchTerm
                        ? `No se encontraron fuentes que coincidan con "${searchTerm}"`
                        : 'No hay fuentes configuradas en el backend'}
                    </div>
                  )}
                </div>
              </div>

              {/* Fuentes Insertadas por el Usuario */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Fuentes Insertadas por el Usuario
                  </h2>
                  <span className="text-xs text-slate-500">({userSources.length})</span>
                </div>
                <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
                  {userSources.length > 0 ? (
                    <SourcesTable
                      sources={userSources}
                      ingest={ingest}
                      deindex={deindex}
                      isIngesting={isIngesting}
                      hideIngestAction
                    />
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      {searchTerm
                        ? `No se encontraron fuentes que coincidan con "${searchTerm}"`
                        : 'Aún no has agregado fuentes — usa la sección Conocimiento para subir archivos o ingerir URLs'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
