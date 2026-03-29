import { useState } from 'react';
import { Search as SearchIcon, TrendingUp, Database, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { useSearch, type SearchMode } from '../../hooks/useSearch';

export function Search() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid');
  const [topK, setTopK] = useState([10]);
  const { results, isSearching, error, search } = useSearch();

  const handleSearch = () => search(query, searchMode, topK[0]);

  const getSearchModeColor = (mode: SearchMode) => {
    switch (mode) {
      case 'bm25':    return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'vector':  return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'hybrid':  return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a]">
      {/* Header */}
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4">
        <h1 className="font-semibold text-white">Explorador de Búsqueda</h1>
        <p className="text-sm text-slate-400">Valida la calidad del retrieval sin generación LLM</p>
      </div>

      {/* Search Controls */}
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
            {/* Search Mode */}
            <div>
              <label className="text-sm font-medium text-slate-300 mb-3 block">
                Método de Recuperación
              </label>
              <div className="flex gap-2">
                {(['bm25', 'vector', 'hybrid'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSearchMode(mode)}
                    className={`
                      flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all
                      ${searchMode === mode
                        ? getSearchModeColor(mode)
                        : 'bg-[#1a2332] border-[#2d3748] text-slate-400 hover:bg-[#1f2937] hover:text-slate-300'
                      }
                    `}
                  >
                    {mode === 'bm25' ? 'Solo BM25' : mode === 'vector' ? 'Solo Vector' : 'Híbrido'}
                  </button>
                ))}
              </div>
            </div>

            {/* Top K Slider */}
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

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-5xl mx-auto">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {results.length === 0 && !isSearching && !error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">No se ha realizado ninguna búsqueda</h3>
              <p className="text-sm text-slate-400">
                Ingresa una consulta arriba para probar la calidad del retrieval e inspeccionar el ranking
              </p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-slate-300">Buscando...</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-white">Resultados de Búsqueda</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Se encontraron {results.length} resultados usando{' '}
                    <Badge className={getSearchModeColor(searchMode)}>{searchMode}</Badge> retrieval
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6 hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-[#1a2332] border border-[#2d3748] rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-slate-300">#{result.rank}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-white">{result.title}</h3>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="font-semibold text-blue-400">
                              {(result.score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 mb-3 inline-block"
                          >
                            {result.url}
                          </a>
                        )}

                        {result.text && (
                          <p className="text-sm text-slate-400 mb-3">{result.text}</p>
                        )}

                        {result.breadcrumb && (
                          <p className="text-xs text-slate-600 mb-2">{result.breadcrumb}</p>
                        )}

                        {result.sourceId && (
                          <div className="flex items-center gap-2">
                            <Database className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-500">{result.sourceId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
