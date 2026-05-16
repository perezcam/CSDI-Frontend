import { useMemo, useState } from 'react';
import { Search as SearchIcon, TrendingUp, Database, AlertCircle, GitCompare, FileText } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { useSearch, type SearchMode } from '../../hooks/useSearch';

type ExplorerMode = SearchMode | 'compare';

export function Search() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<ExplorerMode>('hybrid');
  const [topK, setTopK] = useState([10]);
  const { results, runs, isSearching, error, search, compareAll } = useSearch();

  const handleSearch = () => {
    if (searchMode === 'compare') {
      return compareAll(query, topK[0]);
    }
    return search(query, searchMode, topK[0]);
  };

  const getSearchModeColor = (mode: SearchMode) => {
    switch (mode) {
      case 'bm25': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'vector': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'hybrid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const compareRows = useMemo(() => {
    const byMode: Record<SearchMode, { id: string; rank: number; score: number }[]> = {
      hybrid: [], bm25: [], vector: [],
    };
    for (const run of runs) {
      byMode[run.mode] = run.results.map(r => ({ id: r.id, rank: r.rank, score: r.score }));
    }

    const set = new Set<string>();
    byMode.hybrid.forEach(r => set.add(r.id));
    byMode.bm25.forEach(r => set.add(r.id));
    byMode.vector.forEach(r => set.add(r.id));

    return Array.from(set).slice(0, topK[0]).map((id) => {
      const h = byMode.hybrid.find(r => r.id === id);
      const b = byMode.bm25.find(r => r.id === id);
      const v = byMode.vector.find(r => r.id === id);
      return {
        id,
        hybridRank: h?.rank ?? null,
        bm25Rank: b?.rank ?? null,
        vectorRank: v?.rank ?? null,
      };
    });
  }, [runs, topK]);

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a]">
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4">
        <h1 className="font-semibold text-white">Explorador de Búsqueda</h1>
        <p className="text-sm text-slate-400">Compara BM25, vectorial e híbrido para auditar retrieval y ranking</p>
      </div>

      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ingresa tu consulta de búsqueda para probar el retrieval..."
              className="flex-1 bg-[#1a2332] border-[#2d3748] text-white placeholder:text-slate-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="bg-gradient-to-br from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white shadow-lg shadow-blue-900/30"
            >
              <SearchIcon className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-3 block">
                Modo de Exploración
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['bm25', 'vector', 'hybrid', 'compare'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSearchMode(mode)}
                    className={`
                      px-4 py-2 rounded-lg border text-sm font-medium transition-all
                      ${searchMode === mode
                        ? (mode === 'compare'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : getSearchModeColor(mode))
                        : 'bg-[#1a2332] border-[#2d3748] text-slate-400 hover:bg-[#1f2937] hover:text-slate-300'
                      }
                    `}
                  >
                    {mode === 'bm25' ? 'Solo BM25' : mode === 'vector' ? 'Solo Vector' : mode === 'hybrid' ? 'Solo Híbrido' : 'Comparar (3 métodos)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-3 block">
                Top K Resultados: <span className="text-blue-400">{topK[0]}</span>
              </label>
              <div className="pt-2">
                <Slider
                  value={topK}
                  onValueChange={setTopK}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {results.length === 0 && runs.length === 0 && !isSearching && !error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">No se ha realizado ninguna búsqueda</h3>
              <p className="text-sm text-slate-400">
                Usa "Comparar (3 métodos)" para validar ranking y cobertura entre BM25, vector e híbrido
              </p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-slate-300">Buscando...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {searchMode === 'compare' && runs.length > 0 && (
                <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
                  <div className="px-6 py-4 bg-[#1a2332] border-b border-[#2d3748] flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-semibold text-white">Comparación de Ranking por Chunk</h2>
                  </div>
                  <table className="w-full">
                    <thead className="bg-[#121a28] border-b border-[#2d3748]">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs text-slate-400">Fuente</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400">Fragmento</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400">Doc hash</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400">Híbrido</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400">BM25</th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400">Vector</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a2332]">
                      {compareRows.map((row) => {
                        const parts = row.id.split(':');
                        const src = parts[0] ?? row.id;
                        const hash = parts.length >= 3 ? parts[parts.length - 2] : '';
                        const idx = parts.length >= 3 ? parts[parts.length - 1] : '';
                        return (
                          <tr key={row.id} title={row.id}>
                            <td className="px-4 py-3 text-xs text-cyan-400 font-mono">{src}</td>
                            <td className="px-4 py-3 text-xs text-slate-200 font-mono">#{idx}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 font-mono">{hash}</td>
                            <td className="px-4 py-3 text-sm text-slate-200">{row.hybridRank ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-slate-200">{row.bm25Rank ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-slate-200">{row.vectorRank ?? '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {runs.length > 0 ? runs.map((run) => (
                <div key={run.mode}>
                  <div className="mb-4">
                    <h2 className="font-semibold text-white">Resultados {run.mode.toUpperCase()}</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {run.results.length} resultados · <Badge className={getSearchModeColor(run.mode)}>{run.mode}</Badge>
                    </p>
                  </div>
                  <div className="space-y-4">
                    {run.results.map((result) => (
                      <div key={`${run.mode}-${result.id}`} className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6 hover:border-blue-500/40 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-[#1a2332] border border-[#2d3748] rounded-lg flex items-center justify-center">
                              <span className="font-semibold text-slate-300">#{result.rank}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h3 className="font-semibold text-white">{result.title}</h3>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                <span className="font-semibold text-blue-400">{(result.score * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                            {result.url && (
                              <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 mb-3 inline-block">
                                {result.url}
                              </a>
                            )}
                            {result.text && <p className="text-sm text-slate-400 mb-3">{result.text}</p>}
                            {result.breadcrumb && <p className="text-xs text-slate-500 mb-2 italic">{result.breadcrumb}</p>}
                            <div className="flex items-center gap-3 flex-wrap mt-1">
                              {result.sourceId && (
                                <div className="flex items-center gap-1">
                                  <Database className="w-3 h-3 text-slate-500" />
                                  <span className="text-xs text-slate-500">{result.sourceId}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-500 font-mono">fragmento #{result.chunkIndex} · {result.docHash}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-semibold text-white">Resultados de Búsqueda</h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Se encontraron {results.length} resultados
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {results.map((result) => (
                      <div key={result.id} className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6 hover:border-blue-500/40 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-[#1a2332] border border-[#2d3748] rounded-lg flex items-center justify-center">
                              <span className="font-semibold text-slate-300">#{result.rank}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h3 className="font-semibold text-white">{result.title}</h3>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                <span className="font-semibold text-blue-400">{(result.score * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                            {result.url && (
                              <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 mb-3 inline-block">
                                {result.url}
                              </a>
                            )}
                            {result.text && <p className="text-sm text-slate-400 mb-3">{result.text}</p>}
                            {result.breadcrumb && <p className="text-xs text-slate-500 mb-2 italic">{result.breadcrumb}</p>}
                            <div className="flex items-center gap-3 flex-wrap mt-1">
                              {result.sourceId && (
                                <div className="flex items-center gap-1">
                                  <Database className="w-3 h-3 text-slate-500" />
                                  <span className="text-xs text-slate-500">{result.sourceId}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-500 font-mono">fragmento #{result.chunkIndex} · {result.docHash}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
