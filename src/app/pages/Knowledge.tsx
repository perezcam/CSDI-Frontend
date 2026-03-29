import { useState } from 'react';
import {
  Upload,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { sourcesService } from '../../services/sources.service';

type ItemStatus = 'pending' | 'processing' | 'completed' | 'error';

interface UploadItem {
  id: string;
  name: string;
  type: 'file' | 'url';
  size?: string;
  url?: string;
  status: ItemStatus;
  errorMessage?: string;
}

export function Knowledge() {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
  };

  const addFiles = (files: File[]) => {
    const newItems: UploadItem[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: 'file',
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: 'pending',
    }));
    setUploadItems(prev => [...prev, ...newItems]);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const newItem: UploadItem = {
      id: Date.now().toString(),
      name: urlInput,
      type: 'url',
      url: urlInput,
      status: 'pending',
    };
    setUploadItems(prev => [...prev, newItem]);
    setUrlInput('');
  };

  const handleRemoveItem = (id: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== id));
  };

  const handleIngest = async () => {
    const pending = uploadItems.filter(item => item.status === 'pending');

    // Mark all pending items as processing
    setUploadItems(prev =>
      prev.map(item =>
        item.status === 'pending' ? { ...item, status: 'processing' } : item,
      ),
    );

    // Process URL items via the backend ingest endpoint (source_id = URL)
    // File items would require a future upload endpoint — marked as error for now
    await Promise.all(
      pending.map(async (item) => {
        if (item.type === 'file') {
          // File upload endpoint not yet available in the backend
          setUploadItems(prev =>
            prev.map(i =>
              i.id === item.id
                ? { ...i, status: 'error', errorMessage: 'Subida de archivos no disponible aún' }
                : i,
            ),
          );
          return;
        }

        try {
          await sourcesService.ingest({ source_id: item.url! });
          setUploadItems(prev =>
            prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i),
          );
        } catch (err) {
          setUploadItems(prev =>
            prev.map(i =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'error',
                    errorMessage: err instanceof Error ? err.message : 'Error al ingerir',
                  }
                : i,
            ),
          );
        }
      }),
    );
  };

  const getStatusIcon = (status: ItemStatus) => {
    switch (status) {
      case 'pending':    return <FileText className="w-5 h-5 text-slate-400" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'completed':  return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error':      return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusBadge = (item: UploadItem) => {
    switch (item.status) {
      case 'pending':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Pendiente</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Procesando</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Ingerido</Badge>;
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30" title={item.errorMessage}>
            Error
          </Badge>
        );
    }
  };

  const fileItems = uploadItems.filter(item => item.type === 'file');
  const urlItems = uploadItems.filter(item => item.type === 'url');
  const pendingCount = uploadItems.filter(item => item.status === 'pending').length;

  return (
    <div className="h-full overflow-y-auto bg-[#0a0e1a]">
      {/* Header */}
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="font-semibold text-white">Conocimiento</h1>
            <p className="text-sm text-slate-400">Agrega nuevas fuentes al sistema de búsqueda</p>
          </div>
          {uploadItems.length > 0 && (
            <Button
              onClick={handleIngest}
              disabled={pendingCount === 0}
              className="bg-gradient-to-br from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white shadow-lg shadow-blue-900/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ingerir Conocimiento ({pendingCount})
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* File Upload */}
          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
            <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              Subir Archivos
            </h2>
            <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              El endpoint de subida de archivos estará disponible en una próxima versión del backend
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-all
                ${isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-[#2d3748] bg-[#1a2332]/50 hover:border-blue-500/50'
                }
              `}
            >
              <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">
                Arrastra archivos aquí o haz clic para seleccionar
              </h3>
              <p className="text-sm text-slate-400 mb-4">Soportado: PDF, DOCX, TXT, MD, HTML</p>
              <label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md,.html"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="bg-[#1a2332] border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                  }}
                >
                  Seleccionar Archivos
                </Button>
              </label>
            </div>
          </div>

          {/* URL Section — uses POST /api/v1/ingest { source_id } */}
          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-400" />
              Agregar Fuentes por URL
            </h2>

            <div className="flex gap-3">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="python_docs  o  https://docs.example.com"
                className="flex-1 bg-[#1a2332] border-[#2d3748] text-white placeholder:text-slate-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
              />
              <Button
                onClick={handleAddUrl}
                disabled={!urlInput.trim()}
                className="bg-[#1a2332] border border-[#2d3748] text-slate-300 hover:bg-[#1f2937] hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Usa el source_id configurado en el backend (ej: python_docs) o una URL de sitio web
            </p>
          </div>

          {/* Queue */}
          {uploadItems.length > 0 && (
            <div className="space-y-4">
              {fileItems.length > 0 && (
                <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
                  <div className="px-6 py-3 bg-[#1a2332] border-b border-[#2d3748]">
                    <h3 className="font-semibold text-white text-sm">Archivos ({fileItems.length})</h3>
                  </div>
                  <div className="divide-y divide-[#1a2332]">
                    {fileItems.map((item) => (
                      <div
                        key={item.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-[#1a2332]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(item.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(item)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={item.status === 'processing'}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {urlItems.length > 0 && (
                <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
                  <div className="px-6 py-3 bg-[#1a2332] border-b border-[#2d3748]">
                    <h3 className="font-semibold text-white text-sm">URLs / Fuentes ({urlItems.length})</h3>
                  </div>
                  <div className="divide-y divide-[#1a2332]">
                    {urlItems.map((item) => (
                      <div
                        key={item.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-[#1a2332]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(item.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.url}</p>
                            {item.errorMessage && (
                              <p className="text-xs text-red-400">{item.errorMessage}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(item)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={item.status === 'processing'}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {uploadItems.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">No hay elementos para ingerir</h3>
              <p className="text-sm text-slate-400">
                Sube archivos o agrega URLs para expandir tu base de conocimiento
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
