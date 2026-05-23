import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { useScrapedDocuments } from '../../hooks/useScrapedDocuments';
import { sourcesService } from '../../services/sources.service';
import type { ConfiguredSource, ScrapedDocument } from '../../types/api';

const ALL_SOURCES = '__all_sources__';
const PAGE_SIZES = [10, 20, 50, 100];

export function ScrapedDocuments() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [sources, setSources] = useState<ConfiguredSource[]>([]);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useScrapedDocuments({
    page,
    page_size: pageSize,
    source_id: sourceId,
  });

  useEffect(() => {
    sourcesService.list()
      .then(setSources)
      .catch((err) => {
        setSourcesError(err instanceof Error ? err.message : 'No se pudieron cargar las fuentes');
      });
  }, []);

  useEffect(() => {
    const items = data?.items ?? [];
    if (items.length === 0) {
      setSelectedDocumentId(null);
      return;
    }
    if (!items.some(item => item.document_id === selectedDocumentId)) {
      setSelectedDocumentId(items[0].document_id);
    }
  }, [data, selectedDocumentId]);

  const selectedDocument = useMemo(
    () => data?.items.find(item => item.document_id === selectedDocumentId) ?? null,
    [data, selectedDocumentId],
  );

  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 0;
  const items = data?.items ?? [];
  const fromItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toItem = total === 0 ? 0 : Math.min(page * pageSize, total);

  const handleSourceChange = (value: string) => {
    setSourceId(value === ALL_SOURCES ? null : value);
    setPage(1);
    setSelectedDocumentId(null);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
    setSelectedDocumentId(null);
  };

return (
    <div className="h-full flex flex-col bg-[#0a0e1a]">
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-white">Documentos Scrapeados</h1>
            <p className="text-sm text-slate-400">Páginas persistidas por orden de descarga</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isLoading}
            className="bg-[#1a2332] border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(220px,320px)_160px_1fr] gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Fuente</Label>
            <Select value={sourceId ?? ALL_SOURCES} onValueChange={handleSourceChange}>
              <SelectTrigger className="bg-[#1a2332] border-[#2d3748] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f1419] border-[#2d3748] text-slate-200">
                <SelectItem value={ALL_SOURCES}>Todas las fuentes</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source.source_id} value={source.source_id}>
                    {source.source_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Tamaño</Label>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="bg-[#1a2332] border-[#2d3748] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0f1419] border-[#2d3748] text-slate-200">
                {PAGE_SIZES.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size} por página
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {sourcesError && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-yellow-200">
                El filtro de fuentes no está disponible: {sourcesError}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
            <section className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden min-h-[520px]">
              <div className="flex items-center justify-between gap-4 border-b border-[#1a2332] px-5 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200">Páginas descargadas</h2>
                    <p className="text-xs text-slate-500">
                      {total.toLocaleString('es-ES')} documentos encontrados
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                  fetched_at desc
                </Badge>
              </div>

              {isLoading ? (
                <DocumentsSkeleton />
              ) : items.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="divide-y divide-[#1a2332]">
                  {items.map(document => (
                    <DocumentListItem
                      key={document.document_id}
                      document={document}
                      isSelected={document.document_id === selectedDocumentId}
                      onSelect={() => setSelectedDocumentId(document.document_id)}
                    />
                  ))}
                </div>
              )}

              <div className="border-t border-[#1a2332] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Mostrando {fromItem.toLocaleString('es-ES')}-{toItem.toLocaleString('es-ES')} de {total.toLocaleString('es-ES')}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(current => Math.max(1, current - 1))}
                    disabled={isLoading || page <= 1}
                    className="bg-[#1a2332] border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <span className="min-w-[92px] text-center text-xs text-slate-400">
                    {totalPages === 0 ? 'Página 0/0' : `Página ${page}/${totalPages}`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                    disabled={isLoading || totalPages === 0 || page >= totalPages}
                    className="bg-[#1a2332] border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </section>

            <DocumentDetail document={selectedDocument} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentListItem({
  document,
  isSelected,
  onSelect,
}: {
  document: ScrapedDocument;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-5 py-4 transition-colors ${
        isSelected ? 'bg-[#1e3a8a]/20' : 'hover:bg-[#1a2332]/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <Globe className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-blue-300 break-all">{document.url}</p>
          <p className="text-sm text-slate-400 leading-6 line-clamp-2">
            {document.text_preview || 'Sin preview disponible.'}
          </p>
        </div>
      </div>
    </button>
  );
}

function DocumentDetail({ document }: { document: ScrapedDocument | null }) {
  if (!document) {
    return (
      <aside className="bg-[#0f1419] border border-[#1a2332] rounded-lg min-h-[520px] flex items-center justify-center px-6">
        <div className="text-center">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Selecciona una página para ver el detalle.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="bg-[#0f1419] border border-[#1a2332] rounded-lg min-h-[520px] overflow-hidden">
      <div className="border-b border-[#1a2332] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white break-words">
              {document.title || 'Documento sin título'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 break-all">{document.document_id}</p>
          </div>
          {document.is_active ? (
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Activo
            </Badge>
          ) : (
            <Badge className="bg-slate-500/15 text-slate-300 border-slate-500/30">
              <XCircle className="w-3 h-3" />
              Inactivo
            </Badge>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <DetailLabel icon={<ExternalLink className="w-4 h-4" />} label="URL original" />
          <a
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-300 hover:text-blue-200 break-all"
          >
            {document.url}
          </a>
        </div>

        <div className="rounded-lg bg-[#0a0e1a] border border-[#1a2332] p-4">
          <DetailLabel icon={<FileText className="w-4 h-4" />} label="Preview del texto" />
          <p className="mt-3 text-sm text-slate-300 leading-6 whitespace-pre-wrap">
            {document.text_preview || 'Sin preview disponible.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DetailField label="Fuente" value={document.source_id} />
          <DetailField label="HTTP" value={String(document.http_status)} />
          <DetailField label="Tipo" value={document.content_type || '—'} />
          <DetailField label="Profundidad" value={formatNullableNumber(document.crawl_depth)} />
        </div>

        {document.breadcrumb && (
          <DetailField label="Breadcrumb" value={document.breadcrumb} />
        )}

        <div className="space-y-3">
          <DetailLabel icon={<Calendar className="w-4 h-4" />} label="Fechas" />
          <div className="grid grid-cols-1 gap-3">
            <DetailField label="Descargado" value={formatDate(document.fetched_at)} />
            <DetailField label="Última vista" value={formatDate(document.last_seen_at)} />
            <DetailField label="Publicado" value={formatDate(document.published_at)} />
            <DetailField label="Actualizado en sitio" value={formatDate(document.document_updated_at)} />
            <DetailField label="Creado" value={formatDate(document.created_at)} />
            <DetailField label="Actualizado" value={formatDate(document.updated_at)} />
          </div>
        </div>

      </div>
    </aside>
  );
}

function DetailLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#0a0e1a] border border-[#1a2332] px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-200 break-words">{value || '—'}</p>
    </div>
  );
}

function DocumentsSkeleton() {
  return (
    <div className="divide-y divide-[#1a2332]">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="px-5 py-4 space-y-3">
          <Skeleton className="h-4 w-4/5 bg-[#1a2332]" />
          <Skeleton className="h-4 w-full bg-[#1a2332]" />
          <Skeleton className="h-4 w-2/3 bg-[#1a2332]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6">
      <FileText className="w-9 h-9 text-slate-600 mx-auto mb-3" />
      <h3 className="text-sm font-semibold text-slate-300">No hay documentos para estos filtros</h3>
      <p className="text-sm text-slate-500 mt-1">
        Cambia la fuente o incluye documentos inactivos para ampliar la búsqueda.
      </p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNullableNumber(value: number | null) {
  return value === null ? '—' : String(value);
}
