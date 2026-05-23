import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  GitCompare,
  ListChecks,
  Save,
  Search as SearchIcon,
  Star,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { useSearch, type SearchMode, type SearchResultItem } from '../../hooks/useSearch';
import { useEvaluation } from '../../hooks/useEvaluation';
import { getSourceTypeLabel } from '../../lib/sourceType';
import { useQueryFeedbackComparison } from '../../hooks/useQueryFeedbackComparison';
import type {
  EvaluationRankingResult,
  EvaluationRankingsResponse,
  EvaluationReport,
  ConfiguredSource,
  QueryFeedbackComparableResult,
  QueryFeedbackComparisonMode,
  QueryFeedbackComparisonOption,
  QueryFeedbackPreference,
  RetrievalStrategy,
  StrategyMetrics,
} from '../../types/api';

type ExplorerMode = SearchMode | 'compare';
type PageMode = 'explore' | 'evaluate' | 'metrics';
type SourceScope = 'all' | 'selected';

const STRATEGIES: RetrievalStrategy[] = ['bm25', 'vector', 'hybrid'];
const RELEVANCE_LABELS = {
  0: '0 No relevante',
  1: '1 Marginal',
  2: '2 Relevante',
  3: '3 Muy relevante',
} as const;
const METRIC_KEYS: Array<keyof StrategyMetrics> = [
  'precision_at_k',
  'recall_at_k',
  'f1_at_k',
  'reciprocal_rank',
  'ndcg_at_k',
];

export function Search() {
  const [query, setQuery] = useState('');
  const [pageMode, setPageMode] = useState<PageMode>('explore');
  const [searchMode, setSearchMode] = useState<ExplorerMode>('hybrid');
  const [evaluationStrategies, setEvaluationStrategies] = useState<RetrievalStrategy[]>(STRATEGIES);
  const [topK, setTopK] = useState([10]);
  const [sourceScope, setSourceScope] = useState<SourceScope>('all');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const { results, runs, isSearching, error, search, compareAll } = useSearch();
  const evaluation = useEvaluation();
  const queryFeedbackComparison = useQueryFeedbackComparison();
  const hasSyncedInitialQuery = useRef(false);

  useEffect(() => {
    void evaluation.loadQueries();
    void evaluation.loadSummary();
    void evaluation.loadReport();
    void evaluation.loadSources();
  }, []);

  const selectedQuery = useMemo(
    () => evaluation.queries.find(item => item.id === evaluation.selectedQueryId) ?? null,
    [evaluation.queries, evaluation.selectedQueryId],
  );

  useEffect(() => {
    if (!selectedQuery || hasSyncedInitialQuery.current) return;
    syncQueryScope(selectedQuery, setQuery, setSourceScope, setSelectedSourceIds);
    hasSyncedInitialQuery.current = true;
  }, [selectedQuery]);

  const compareRows = useCompareRows(runs, topK[0]);
  const latestReport = evaluation.report;
  const bestNdcgStrategy = useBestStrategy(latestReport, 'ndcg_at_k');

  const handleSearch = async () => {
    if (pageMode !== 'explore') return;
    if (!query.trim()) return;

    const activated = await queryFeedbackComparison.startComparison(query, topK[0]);
    if (activated) {
      return;
    }

    if (searchMode === 'compare') {
      return compareAll(query, topK[0]);
    }
    return search(query, searchMode, topK[0]);
  };

  const handleSaveQueryFeedbackPreference = async (preference: QueryFeedbackPreference) => {
    try {
      await queryFeedbackComparison.savePreference(preference);
      toast.success('Preferencia guardada');
    } catch {
      toast.error('No se pudo guardar la preferencia');
    }
  };

  const handleSaveCurrentQuery = async () => {
    if (!query.trim()) return;
    if (sourceScope === 'selected' && selectedSourceIds.length === 0) {
      toast.error('Seleccione al menos una fuente o use Todas las fuentes.');
      return;
    }
    try {
      const created = await evaluation.createQuery({
        query: query.trim(),
        source_ids: sourceScope === 'all' ? null : selectedSourceIds,
      });
      if (created) toast.success('Consulta guardada para evaluación');
    } catch {
      toast.error('No se pudo guardar la consulta');
    }
  };

  const handleSelectQuery = async (queryId: string) => {
    const selected = evaluation.queries.find(item => item.id === queryId);
    if (selected) {
      syncQueryScope(selected, setQuery, setSourceScope, setSelectedSourceIds);
      hasSyncedInitialQuery.current = true;
    }
    try {
      await evaluation.selectQuery(queryId);
    } catch {
      toast.error('No se pudo cargar la consulta de evaluación');
    }
  };

  const handleRunEvaluationRankings = async () => {
    if (!evaluation.selectedQueryId) return;
    if (evaluationStrategies.length === 0) {
      toast.error('Seleccione al menos un método de evaluación.');
      return;
    }
    try {
      await evaluation.runRankings(evaluation.selectedQueryId, {
        top_k: topK[0],
        strategies: evaluationStrategies,
      });
      toast.success('Rankings de evaluación actualizados');
    } catch {
      toast.error('No se pudo ejecutar el ranking de evaluación');
    }
  };

  const handleUpdateJudgment = async (chunkId: string, relevance: 0 | 1 | 2 | 3) => {
    if (!evaluation.selectedQueryId) return;
    try {
      await evaluation.updateJudgment(evaluation.selectedQueryId, chunkId, { relevance });
      toast.success('Relevancia guardada');
    } catch {
      toast.error('No se pudo guardar la relevancia');
    }
  };

  const handleRunEvaluation = async () => {
    try {
      await evaluation.runEvaluation(topK[0]);
      toast.success('Evaluación ejecutada');
    } catch {
      toast.error('No se pudo ejecutar la evaluación');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a]">
      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-4">
        <h1 className="font-semibold text-white">Explorador de Búsqueda</h1>
        <p className="text-sm text-slate-400">Explora retrieval y construye datasets de evaluación IR</p>
      </div>

      <div className="bg-[#0f1419] border-b border-[#1a2332] px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <ModeTabs pageMode={pageMode} onChange={setPageMode} />

          {pageMode !== 'metrics' && (
            <>
              <div className="flex gap-3">
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    queryFeedbackComparison.resetComparison();
                  }}
                  placeholder="Ingresa tu consulta de búsqueda para probar o guardar en evaluación..."
                  className="flex-1 bg-[#1a2332] border-[#2d3748] text-white placeholder:text-slate-500"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && pageMode === 'explore') {
                      void handleSearch();
                    }
                  }}
                />
                {pageMode === 'explore' ? (
                  <Button
                    onClick={() => void handleSearch()}
                    disabled={isSearching || queryFeedbackComparison.isLoading || !query.trim()}
                    className="bg-gradient-to-br from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white shadow-lg shadow-blue-900/30"
                  >
                    <SearchIcon className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                ) : (
                  <Button
                    onClick={handleSaveCurrentQuery}
                    disabled={evaluation.isLoading || !query.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar consulta actual
                  </Button>
                )}
              </div>

              <ControlsPanel
                pageMode={pageMode}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                evaluationStrategies={evaluationStrategies}
                setEvaluationStrategies={setEvaluationStrategies}
                topK={topK}
                setTopK={setTopK}
              />
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {pageMode === 'explore' ? (
            <ExplorePanel
              error={error}
              isSearching={isSearching}
              results={results}
              runs={runs}
              searchMode={searchMode}
              compareRows={compareRows}
              queryFeedbackComparison={queryFeedbackComparison}
              onSaveQueryFeedbackPreference={handleSaveQueryFeedbackPreference}
            />
          ) : pageMode === 'evaluate' ? (
            <EvaluationPanel
              evaluation={evaluation}
              selectedQuery={selectedQuery}
              selectedStrategies={evaluationStrategies}
              topK={topK[0]}
              bestNdcgStrategy={bestNdcgStrategy}
              onSelectQuery={handleSelectQuery}
              sourceScope={sourceScope}
              selectedSourceIds={selectedSourceIds}
              onSourceScopeChange={setSourceScope}
              onSelectedSourceIdsChange={setSelectedSourceIds}
              onRunRankings={handleRunEvaluationRankings}
              onUpdateJudgment={handleUpdateJudgment}
              onRunEvaluation={handleRunEvaluation}
            />
          ) : (
            <MetricsExplanationPanel />
          )}
        </div>
      </div>
    </div>
  );
}

function ModeTabs({ pageMode, onChange }: { pageMode: PageMode; onChange: (mode: PageMode) => void }) {
  return (
    <div className="inline-flex bg-[#1a2332] border border-[#2d3748] rounded-lg p-1">
      {([
        ['explore', 'Exploración'],
        ['evaluate', 'Evaluación'],
        ['metrics', 'Métricas'],
      ] as const).map(([mode, label]) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            pageMode === mode
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function MetricsExplanationPanel() {
  const metricCards = [
    {
      name: 'Precision@K',
      accent: 'cyan',
      measures: 'Mide cuántos de los primeros K documentos recuperados son realmente relevantes.',
      interpretation: 'Un Precision@K alto indica que los primeros resultados son mayormente útiles.',
      bestValue: '1.0',
      useCase: 'Útil cuando se prioriza la calidad de los primeros resultados.',
    },
    {
      name: 'Recall@K',
      accent: 'emerald',
      measures: 'Mide cuántos de todos los documentos relevantes disponibles fueron recuperados dentro de los primeros K.',
      interpretation: 'Un Recall@K alto indica que el sistema encontró la mayor parte del material relevante juzgado.',
      bestValue: '1.0',
      useCase: 'Útil cuando perder documentos relevantes tiene un costo alto.',
    },
    {
      name: 'F1@K',
      accent: 'blue',
      measures: 'Balancea armónicamente Precision@K y Recall@K en una sola métrica.',
      interpretation: 'Un F1@K alto indica una estrategia equilibrada entre calidad y cobertura.',
      bestValue: '1.0',
      useCase: 'Útil para comparar métodos con un puntaje único y balanceado.',
    },
    {
      name: 'MRR',
      accent: 'amber',
      measures: 'Mean Reciprocal Rank. Mide qué tan pronto aparece el primer documento relevante en el ranking.',
      interpretation: 'Un MRR alto indica que el primer resultado útil aparece muy arriba.',
      bestValue: '1.0',
      useCase: 'Útil en búsqueda o question answering donde importa mucho el primer acierto.',
    },
    {
      name: 'NDCG@K',
      accent: 'violet',
      measures: 'Evalúa la calidad del ranking usando relevancia graduada y penalizando los documentos muy relevantes ubicados demasiado abajo.',
      interpretation: 'Un NDCG@K alto indica que los documentos más relevantes quedaron cerca del inicio del ranking.',
      bestValue: '1.0',
      useCase: 'Especialmente útil aquí porque el proyecto usa niveles de relevancia 0, 1, 2 y 3.',
    },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-blue-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-white">Métricas de evaluación IR</h2>
            <p className="text-sm text-slate-400 mt-2">
              Estas métricas permiten medir la calidad de los rankings generados por BM25, búsqueda vectorial e híbrida.
            </p>
            <p className="text-sm text-slate-300 mt-4">
              El método de retrieval seleccionado no cambia la fórmula de las métricas. Lo que cambia es el ranking de documentos sobre el que se calculan.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {metricCards.map((metric) => (
          <article key={metric.name} className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{metric.name}</h3>
              <span className={getMetricAccent(metric.accent)}>
                Mejor valor: {metric.bestValue}
              </span>
            </div>
            <div className="space-y-4 mt-4">
              <MetricDetail label="Qué mide" value={metric.measures} />
              <MetricDetail label="Cómo interpretarla" value={metric.interpretation} />
              <MetricDetail label="Ejemplo de uso" value={metric.useCase} />
            </div>
          </article>
        ))}
      </section>

      <section className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white">Cómo se relacionan con el flujo de evaluación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-5">
          {[
            'Se crea o selecciona una consulta.',
            'El sistema genera rankings con los métodos de retrieval elegidos.',
            'Se asigna relevancia de 0 a 3 a cada fragmento recuperado.',
            'El backend calcula las métricas sobre rankings generados y juicios guardados.',
            'Las métricas comparan estrategias de retrieval, no cambian la fórmula de evaluación.',
          ].map((step, index) => (
            <div key={step} className="bg-[#121a28] border border-[#1a2332] rounded-lg p-4">
              <p className="text-xs font-mono text-blue-400">Paso {index + 1}</p>
              <p className="text-sm text-slate-300 mt-2">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white">Escala de relevancia</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
          {([
            [0, 'No relevante', 'bg-slate-500/15 text-slate-300 border-slate-500/30'],
            [1, 'Marginal', 'bg-amber-500/15 text-amber-300 border-amber-500/30'],
            [2, 'Relevante', 'bg-blue-500/15 text-blue-300 border-blue-500/30'],
            [3, 'Muy relevante', 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'],
          ] as const).map(([value, label, tone]) => (
            <div key={value} className={`rounded-lg border p-4 ${tone}`}>
              <p className="text-sm font-semibold">{value}</p>
              <p className="text-sm mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-300 mt-1">{value}</p>
    </div>
  );
}

function ControlsPanel({
  pageMode,
  searchMode,
  setSearchMode,
  evaluationStrategies,
  setEvaluationStrategies,
  topK,
  setTopK,
}: {
  pageMode: PageMode;
  searchMode: ExplorerMode;
  setSearchMode: (mode: ExplorerMode) => void;
  evaluationStrategies: RetrievalStrategy[];
  setEvaluationStrategies: (strategies: RetrievalStrategy[]) => void;
  topK: number[];
  setTopK: (value: number[]) => void;
}) {
  const toggleEvaluationStrategy = (strategy: RetrievalStrategy) => {
    setEvaluationStrategies(
      evaluationStrategies.includes(strategy)
        ? evaluationStrategies.filter(item => item !== strategy)
        : [...evaluationStrategies, strategy],
    );
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="text-sm font-medium text-slate-300 mb-3 block">
          {pageMode === 'explore' ? 'Método de Retrieval' : 'Métodos a evaluar'}
        </label>
        {pageMode === 'explore' ? (
          <div className="grid grid-cols-2 gap-2">
            {(['bm25', 'vector', 'hybrid', 'compare'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSearchMode(mode)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  searchMode === mode
                    ? getSearchModeColor(mode)
                    : 'bg-[#1a2332] border-[#2d3748] text-slate-400 hover:bg-[#1f2937] hover:text-slate-300'
                }`}
              >
                {mode === 'bm25' ? 'Solo BM25' : mode === 'vector' ? 'Solo Vector' : mode === 'hybrid' ? 'Solo Híbrido' : 'Comparar (3 métodos)'}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {STRATEGIES.map((strategy) => (
                <button
                  key={strategy}
                  type="button"
                  onClick={() => toggleEvaluationStrategy(strategy)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    evaluationStrategies.includes(strategy)
                      ? getSearchModeColor(strategy)
                      : 'bg-[#1a2332] border-[#2d3748] text-slate-400 hover:bg-[#1f2937] hover:text-slate-300'
                  }`}
                >
                  {strategy === 'bm25' ? 'BM25' : strategy === 'vector' ? 'Vector' : 'Híbrido'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Seleccione los métodos que desea evaluar. Para comparar el sistema completo, mantenga BM25, Vector e Híbrido seleccionados.
            </p>
          </div>
        )}
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
  );
}

function ExplorePanel({
  error,
  isSearching,
  results,
  runs,
  searchMode,
  compareRows,
  queryFeedbackComparison,
  onSaveQueryFeedbackPreference,
}: {
  error: string | null;
  isSearching: boolean;
  results: SearchResultItem[];
  runs: ReturnType<typeof useSearch>['runs'];
  searchMode: ExplorerMode;
  compareRows: ReturnType<typeof useCompareRows>;
  queryFeedbackComparison: ReturnType<typeof useQueryFeedbackComparison>;
  onSaveQueryFeedbackPreference: (preference: QueryFeedbackPreference) => Promise<void>;
}) {
  if (queryFeedbackComparison.isLoading) {
    return <LoadingState label="Preparando comparación de resultados..." />;
  }
  if (
    queryFeedbackComparison.isComparisonActive &&
    queryFeedbackComparison.optionA &&
    queryFeedbackComparison.optionB
  ) {
    return (
      <div className="space-y-4">
        {queryFeedbackComparison.error && <ErrorBox message={queryFeedbackComparison.error} />}
        <QueryFeedbackComparisonPanel
          mode={queryFeedbackComparison.comparisonMode}
          optionA={queryFeedbackComparison.optionA}
          optionB={queryFeedbackComparison.optionB}
          isSavingPreference={queryFeedbackComparison.isSavingPreference}
          preferenceSaved={queryFeedbackComparison.preferenceSaved}
          error={queryFeedbackComparison.error}
          onSavePreference={onSaveQueryFeedbackPreference}
        />
      </div>
    );
  }
  if (queryFeedbackComparison.error && queryFeedbackComparison.isComparisonActive) {
    return <ErrorBox message={queryFeedbackComparison.error} />;
  }
  if (error) return <ErrorBox message={error} />;
  if (isSearching) return <LoadingState label="Buscando..." />;
  if (results.length === 0 && runs.length === 0) {
    return (
      <EmptyState
        icon={<SearchIcon className="w-8 h-8 text-slate-500" />}
        title="No se ha realizado ninguna búsqueda"
        text="Usa Comparar para validar ranking y cobertura entre BM25, vector e híbrido"
      />
    );
  }

  return (
    <div className="space-y-6">
      {searchMode === 'compare' && runs.length > 0 && <CompareTable rows={compareRows} />}
      {runs.length > 0 ? (
        runs.map((run) => (
          <SearchRunSection key={run.mode} mode={run.mode} results={run.results} />
        ))
      ) : (
        <SearchRunSection mode="hybrid" results={results} title="Resultados de Búsqueda" />
      )}
    </div>
  );
}

function QueryFeedbackComparisonPanel({
  mode,
  optionA,
  optionB,
  isSavingPreference,
  preferenceSaved,
  error,
  onSavePreference,
}: {
  mode: QueryFeedbackComparisonMode;
  optionA: QueryFeedbackComparisonOption;
  optionB: QueryFeedbackComparisonOption;
  isSavingPreference: boolean;
  preferenceSaved: boolean;
  error: string | null;
  onSavePreference: (preference: QueryFeedbackPreference) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-white">Comparación de resultados</h2>
            <p className="text-sm text-slate-400 mt-2">
              Te mostramos dos variantes de resultados. Indica cuál te ayuda más para mejorar futuras búsquedas.
            </p>
          </div>
          <Badge className={mode === 'feedback' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'}>
            {mode === 'feedback' ? 'Comparación con feedback previo' : 'Comparación con expansión'}
          </Badge>
        </div>
        {preferenceSaved && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Preferencia guardada. Se usará para mejorar futuras búsquedas.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <QueryFeedbackOptionColumn option={optionA} />
        <QueryFeedbackOptionColumn option={optionB} />
      </div>

      <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Button
            type="button"
            onClick={() => void onSavePreference('prefer_a')}
            disabled={isSavingPreference || preferenceSaved}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Prefiero A
          </Button>
          <Button
            type="button"
            onClick={() => void onSavePreference('prefer_b')}
            disabled={isSavingPreference || preferenceSaved}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Prefiero B
          </Button>
          <Button
            type="button"
            onClick={() => void onSavePreference('both')}
            disabled={isSavingPreference || preferenceSaved}
            className="bg-[#1a2332] border border-[#2d3748] text-slate-200 hover:bg-[#243041]"
          >
            Ambas son útiles
          </Button>
          <Button
            type="button"
            onClick={() => void onSavePreference('neither')}
            disabled={isSavingPreference || preferenceSaved}
            className="bg-[#1a2332] border border-[#2d3748] text-slate-200 hover:bg-[#243041]"
          >
            Ninguna me sirve
          </Button>
        </div>
      </div>
    </div>
  );
}

function QueryFeedbackOptionColumn({ option }: { option: QueryFeedbackComparisonOption }) {
  return (
    <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
      <div className="px-5 py-4 bg-[#1a2332] border-b border-[#2d3748]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white">{option.id} · {option.label}</h3>
            <p className="text-sm text-slate-400 mt-1">{option.description}</p>
          </div>
          <Badge className={option.strategy === 'feedback' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : option.strategy === 'expanded' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'}>
            {option.strategy}
          </Badge>
        </div>
      </div>
      <div className="divide-y divide-[#1a2332]">
        {option.results.slice(0, 5).map((result, index) => (
          <QueryFeedbackComparableResultCard
            key={`${option.id}-${result.chunk_id}`}
            result={result}
            rank={index + 1}
          />
        ))}
        {option.results.length === 0 && (
          <div className="p-5 text-sm text-slate-400">No hay resultados para esta opción.</div>
        )}
      </div>
    </div>
  );
}

function QueryFeedbackComparableResultCard({
  result,
  rank,
}: {
  result: QueryFeedbackComparableResult;
  rank: number;
}) {
  return (
    <div className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-[#1a2332] border border-[#2d3748] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="font-semibold text-slate-300">#{rank}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h4 className="font-semibold text-white">{result.title || result.chunk_id}</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">{result.chunk_id}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {result.feedback_applied && (
                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {result.feedback_match_type === 'semantic' ? 'Feedback semántico' : 'Feedback aplicado'}
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-blue-400">{result.score.toFixed(4)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-slate-400 line-clamp-4">{result.text}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-slate-500">Fuente: {result.source_id}</span>
              <span className="text-xs text-slate-500 font-mono">Chunk: {result.chunk_id}</span>
              {result.original_score !== undefined && (
                <span className="text-xs text-amber-300">Score original: {result.original_score.toFixed(4)}</span>
              )}
              {result.adjusted_score !== undefined && (
                <span className="text-xs text-emerald-300">Score ajustado: {result.adjusted_score.toFixed(4)}</span>
              )}
              {result.feedback_relevance !== undefined && result.feedback_relevance !== null && (
                <span className="text-xs text-emerald-300">Relevancia: {result.feedback_relevance}</span>
              )}
            </div>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 inline-block"
              >
                {result.url}
              </a>
            )}
            {result.breadcrumb && (
              <p className="text-xs text-slate-500 italic">{result.breadcrumb}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaluationPanel({
  evaluation,
  selectedQuery,
  selectedStrategies,
  topK,
  bestNdcgStrategy,
  onSelectQuery,
  sourceScope,
  selectedSourceIds,
  onSourceScopeChange,
  onSelectedSourceIdsChange,
  onRunRankings,
  onUpdateJudgment,
  onRunEvaluation,
}: {
  evaluation: ReturnType<typeof useEvaluation>;
  selectedQuery: { id: string; query: string; source_ids?: string[] | null } | null;
  selectedStrategies: RetrievalStrategy[];
  topK: number;
  bestNdcgStrategy: RetrievalStrategy | null;
  onSelectQuery: (queryId: string) => void;
  sourceScope: SourceScope;
  selectedSourceIds: string[];
  onSourceScopeChange: (scope: SourceScope) => void;
  onSelectedSourceIdsChange: (sourceIds: string[]) => void;
  onRunRankings: () => void;
  onUpdateJudgment: (chunkId: string, relevance: 0 | 1 | 2 | 3) => void;
  onRunEvaluation: () => void;
}) {
  return (
    <div className="space-y-6">
      {evaluation.error && <ErrorBox message={evaluation.error} />}
      <SummaryCards summary={evaluation.summary} bestNdcgStrategy={bestNdcgStrategy} />

      <div className="grid grid-cols-[320px_1fr] gap-6">
        <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-white">Dataset de evaluación</h2>
          </div>
          <SourceScopeSelector
            sources={evaluation.sources}
            sourcesError={evaluation.sourcesError}
            isLoadingSources={evaluation.isLoadingSources}
            sourceScope={sourceScope}
            selectedSourceIds={selectedSourceIds}
            onSourceScopeChange={onSourceScopeChange}
            onSelectedSourceIdsChange={onSelectedSourceIdsChange}
          />
          {evaluation.queries.length === 0 ? (
            <p className="text-sm text-slate-400 mt-5">No hay consultas persistidas todavía.</p>
          ) : (
            <div className="space-y-2 mt-5">
              {evaluation.queries.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectQuery(item.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg border transition-all ${
                    evaluation.selectedQueryId === item.id
                      ? 'bg-blue-500/10 border-blue-500/40'
                      : 'bg-[#121a28] border-[#1a2332] hover:border-[#2d3748]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-cyan-400">{item.id}</span>
                    <span className="text-xs text-slate-500">{formatSourceScope(item.source_ids)}</span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1 line-clamp-2">{item.query}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-white">Ranking de evaluación</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedQuery ? selectedQuery.query : 'Selecciona o guarda una consulta para empezar.'}
                </p>
                {selectedQuery && (
                  <p className="text-xs text-slate-500 mt-2">
                    Alcance: {formatSourceScope(selectedQuery.source_ids)}
                  </p>
                )}
              </div>
              <Button
                onClick={onRunRankings}
                disabled={!selectedQuery || evaluation.isRunningRankings}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <SearchIcon className="w-4 h-4 mr-2" />
                Ejecutar ranking
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-slate-500">Top K {topK}</span>
              {selectedQuery && (
                <span className="text-xs text-slate-500">· {formatSourceScope(selectedQuery.source_ids)}</span>
              )}
              {selectedStrategies.map(strategy => (
                <Badge key={strategy} className={getSearchModeColor(strategy)}>{strategy}</Badge>
              ))}
            </div>
          </div>

          <EvaluationRankings
            rankings={evaluation.evaluationRankings}
            judgments={evaluation.judgments}
            isLoading={evaluation.isRunningRankings}
            onUpdateJudgment={onUpdateJudgment}
          />

          <MetricsPanel
            report={evaluation.report}
            isRunning={evaluation.isRunningEvaluation}
            onRunEvaluation={onRunEvaluation}
          />
        </div>
      </div>
    </div>
  );
}

function SourceScopeSelector({
  sources,
  sourcesError,
  isLoadingSources,
  sourceScope,
  selectedSourceIds,
  onSourceScopeChange,
  onSelectedSourceIdsChange,
}: {
  sources: ConfiguredSource[];
  sourcesError: string | null;
  isLoadingSources: boolean;
  sourceScope: SourceScope;
  selectedSourceIds: string[];
  onSourceScopeChange: (scope: SourceScope) => void;
  onSelectedSourceIdsChange: (sourceIds: string[]) => void;
}) {
  const toggleSource = (sourceId: string) => {
    onSelectedSourceIdsChange(
      selectedSourceIds.includes(sourceId)
        ? selectedSourceIds.filter(item => item !== sourceId)
        : [...selectedSourceIds, sourceId],
    );
  };

  return (
    <div className="border-b border-[#1a2332] pb-5">
      <label className="text-sm font-medium text-slate-300 mb-3 block">
        Alcance del dataset
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onSourceScopeChange('all');
            onSelectedSourceIdsChange([]);
          }}
          className={`px-3 py-2 rounded-lg border text-sm transition-all ${
            sourceScope === 'all'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              : 'bg-[#121a28] border-[#2d3748] text-slate-400 hover:text-slate-200'
          }`}
        >
          Todas las fuentes
        </button>
        <button
          type="button"
          onClick={() => onSourceScopeChange('selected')}
          className={`px-3 py-2 rounded-lg border text-sm transition-all ${
            sourceScope === 'selected'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              : 'bg-[#121a28] border-[#2d3748] text-slate-400 hover:text-slate-200'
          }`}
        >
          Fuentes seleccionadas
        </button>
      </div>

      {sourcesError && (
        <p className="mt-3 text-xs text-amber-300">
          No se pudieron cargar las fuentes. Puede evaluar contra todas las fuentes.
        </p>
      )}

      {sourceScope === 'selected' && (
        <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-1">
          {isLoadingSources ? (
            <p className="text-xs text-slate-500">Cargando fuentes...</p>
          ) : sources.length === 0 ? (
            <p className="text-xs text-slate-500">No hay fuentes disponibles.</p>
          ) : (
            sources.map(source => (
              <label
                key={source.source_id}
                className="flex items-start gap-3 rounded-lg border border-[#1a2332] bg-[#121a28] px-3 py-2 cursor-pointer hover:border-[#2d3748]"
              >
                <input
                  type="checkbox"
                  checked={selectedSourceIds.includes(source.source_id)}
                  onChange={() => toggleSource(source.source_id)}
                  className="mt-1 accent-blue-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm text-slate-200">{source.name}</span>
                  <span className="block text-xs text-slate-500">
                    {source.source_id} — {source.indexed_chunks ?? 0} chunks
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCards({
  summary,
  bestNdcgStrategy,
}: {
  summary: ReturnType<typeof useEvaluation>['summary'];
  bestNdcgStrategy: RetrievalStrategy | null;
}) {
  const latestNdcg = bestNdcgStrategy ? summary?.latest_averages?.[bestNdcgStrategy]?.ndcg_at_k : undefined;
  const cards = [
    ['Consultas', summary?.queries_count ?? 0],
    ['Juicios', summary?.total_judgments ?? 0],
    ['Consultas juzgadas', summary?.judged_queries_count ?? 0],
    ['Mejor NDCG@K', latestNdcg === undefined ? '—' : `${bestNdcgStrategy} ${(latestNdcg * 100).toFixed(1)}%`],
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(([label, value]) => (
        <div key={label} className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-4">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-semibold text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}

function EvaluationRankings({
  rankings,
  judgments,
  isLoading,
  onUpdateJudgment,
}: {
  rankings: EvaluationRankingsResponse | null;
  judgments: Record<string, number>;
  isLoading: boolean;
  onUpdateJudgment: (chunkId: string, relevance: 0 | 1 | 2 | 3) => void;
}) {
  if (isLoading) return <LoadingState label="Ejecutando rankings de evaluación..." />;
  if (!rankings || Object.keys(rankings.rankings).length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-8 h-8 text-slate-500" />}
        title="No hay rankings para esta consulta"
        text="Ejecuta BM25, Vector, Híbrido o la comparación para generar resultados etiquetables."
      />
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(rankings.rankings).map(([strategy, items]) => (
        <div key={strategy} className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
          <div className="px-5 py-4 bg-[#1a2332] border-b border-[#2d3748] flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">{strategy.toUpperCase()}</h3>
              <p className="text-xs text-slate-400">{items.length} fragmentos recuperados</p>
            </div>
            <Badge className={getSearchModeColor(strategy as RetrievalStrategy)}>{strategy}</Badge>
          </div>
          <div className="divide-y divide-[#1a2332]">
            {items.map((item, index) => (
              <EvaluationResultCard
                key={`${strategy}-${item.chunk_id}`}
                item={item}
                rank={index + 1}
                relevance={judgments[item.chunk_id] ?? item.current_relevance ?? null}
                onUpdateJudgment={onUpdateJudgment}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EvaluationResultCard({
  item,
  rank,
  relevance,
  onUpdateJudgment,
}: {
  item: EvaluationRankingResult;
  rank: number;
  relevance: number | null;
  onUpdateJudgment: (chunkId: string, relevance: 0 | 1 | 2 | 3) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-[#1a2332] border border-[#2d3748] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="font-semibold text-slate-300">#{rank}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h4 className="font-semibold text-white">{item.title || item.chunk_id}</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">{item.chunk_id}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                aria-label={isExpanded ? 'Contraer contenido' : 'Expandir contenido'}
                className="w-9 h-9 rounded-md border border-[#2d3748] bg-[#1a2332] text-slate-300 hover:text-white hover:border-blue-500/50 flex items-center justify-center transition-all"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              <select
                value={relevance ?? ''}
                onChange={(event) => onUpdateJudgment(item.chunk_id, Number(event.target.value) as 0 | 1 | 2 | 3)}
                className="bg-[#1a2332] border border-[#2d3748] rounded-md px-3 py-2 text-sm text-slate-200"
              >
                <option value="" disabled>Relevancia</option>
                {([0, 1, 2, 3] as const).map(value => (
                  <option key={value} value={value}>{RELEVANCE_LABELS[value]}</option>
                ))}
              </select>
            </div>
          </div>
          {isExpanded && (
            <div className="mt-3">
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 inline-block">
                  {item.url}
                </a>
              )}
              {item.text && <p className="text-sm text-slate-400 mt-3">{item.text}</p>}
              {item.breadcrumb && <p className="text-xs text-slate-500 mt-2 italic">{item.breadcrumb}</p>}
            </div>
          )}
          <div className="flex items-center gap-4 flex-wrap mt-3">
            {item.source_id && <span className="text-xs text-slate-500">Fuente: {item.source_id}</span>}
            {item.score !== null && item.score !== undefined && (
              <span className="text-xs text-blue-400">Score: {item.score.toFixed(4)}</span>
            )}
            {relevance !== null && relevance !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {RELEVANCE_LABELS[relevance as 0 | 1 | 2 | 3]}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricsPanel({
  report,
  isRunning,
  onRunEvaluation,
}: {
  report: EvaluationReport | null;
  isRunning: boolean;
  onRunEvaluation: () => void;
}) {
  const bestByMetric = useMemo(() => {
    const best: Partial<Record<keyof StrategyMetrics, RetrievalStrategy>> = {};
    if (!report) return best;
    for (const metric of METRIC_KEYS) {
      let bestStrategy: RetrievalStrategy | null = null;
      let bestValue = -Infinity;
      for (const strategy of STRATEGIES) {
        const value = report.strategies[strategy]?.averages?.[metric];
        if (typeof value === 'number' && value > bestValue) {
          bestValue = value;
          bestStrategy = strategy;
        }
      }
      if (bestStrategy) best[metric] = bestStrategy;
    }
    return best;
  }, [report]);

  const bestNdcg = bestByMetric.ndcg_at_k;

  return (
    <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg overflow-hidden">
      <div className="px-5 py-4 bg-[#1a2332] border-b border-[#2d3748] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-white">Métricas IR</h2>
        </div>
        <Button onClick={onRunEvaluation} disabled={isRunning} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Ejecutar evaluación
        </Button>
      </div>

      {!report ? (
        <div className="p-6 text-sm text-slate-400">No hay reporte todavía. Ejecuta la evaluación cuando existan rankings y juicios.</div>
      ) : (
        <>
          <table className="w-full">
            <thead className="bg-[#121a28] border-b border-[#2d3748]">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-slate-400">Strategy</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400">Precision@K</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400">Recall@K</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400">F1@K</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400">MRR</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400">NDCG@K</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2332]">
              {STRATEGIES.map(strategy => {
                const metrics = report.strategies[strategy]?.averages;
                return (
                  <tr key={strategy}>
                    <td className="px-4 py-3 text-sm text-slate-200 uppercase">{strategy}</td>
                    {METRIC_KEYS.map(metric => (
                      <td
                        key={metric}
                        className={`px-4 py-3 text-sm ${bestByMetric[metric] === strategy ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}
                      >
                        {formatMetric(metrics?.[metric])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-4 bg-[#121a28] border-t border-[#1a2332]">
            <p className="text-sm text-slate-300">
              {bestNdcg
                ? `${bestNdcg.toUpperCase()} obtiene actualmente el mejor NDCG@K; compara este valor con Precision y Recall para decidir el método más estable.`
                : 'Aún no hay valores suficientes para interpretar el mejor método.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function SearchRunSection({ mode, results, title }: { mode: SearchMode; results: SearchResultItem[]; title?: string }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-semibold text-white">{title ?? `Resultados ${mode.toUpperCase()}`}</h2>
        <p className="text-sm text-slate-400 mt-1">
          {results.length} resultados · <Badge className={getSearchModeColor(mode)}>{mode}</Badge>
        </p>
      </div>
      <div className="space-y-4">
        {results.map((result) => (
          <SearchResultCard key={`${mode}-${result.id}`} result={result} />
        ))}
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6 hover:border-blue-500/40 transition-all">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-[#1a2332] border border-[#2d3748] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="font-semibold text-slate-300">#{result.rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h3 className="font-semibold text-white min-w-0">{result.title}</h3>
              <SourceTypeBadge sourceType={result.sourceType} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                aria-label={isExpanded ? 'Contraer contenido' : 'Expandir contenido'}
                className="w-9 h-9 rounded-md border border-[#2d3748] bg-[#1a2332] text-slate-300 hover:text-white hover:border-blue-500/50 flex items-center justify-center transition-all"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-blue-400">{(result.score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          {isExpanded && (
            <div className="mb-3">
              {result.url && (
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 inline-block">
                  {result.url}
                </a>
              )}
              {result.text && <p className="text-sm text-slate-400 mt-3">{result.text}</p>}
              {result.breadcrumb && <p className="text-xs text-slate-500 mt-2 italic">{result.breadcrumb}</p>}
            </div>
          )}
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
  );
}

function SourceTypeBadge({ sourceType }: { sourceType?: string }) {
  const label = getSourceTypeLabel(sourceType);
  if (!label) return null;

  return (
    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
      Fuente: {label}
    </Badge>
  );
}

function CompareTable({ rows }: { rows: ReturnType<typeof useCompareRows> }) {
  return (
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
          {rows.map((row) => (
            <tr key={row.id} title={row.id}>
              <td className="px-4 py-3 text-xs text-cyan-400 font-mono">{row.source}</td>
              <td className="px-4 py-3 text-xs text-slate-200 font-mono">#{row.chunkIndex}</td>
              <td className="px-4 py-3 text-xs text-slate-500 font-mono">{row.docHash}</td>
              <td className="px-4 py-3 text-sm text-slate-200">{row.hybridRank ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-slate-200">{row.bm25Rank ?? '—'}</td>
              <td className="px-4 py-3 text-sm text-slate-200">{row.vectorRank ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="text-center py-16">
      <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-300">{label}</p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      <p className="text-sm text-red-300">{message}</p>
    </div>
  );
}

function useCompareRows(runs: ReturnType<typeof useSearch>['runs'], topK: number) {
  return useMemo(() => {
    const byMode: Record<SearchMode, { id: string; rank: number; score: number }[]> = {
      hybrid: [], bm25: [], vector: [],
    };
    for (const run of runs) {
      byMode[run.mode] = run.results.map(result => ({ id: result.id, rank: result.rank, score: result.score }));
    }

    const ids = new Set<string>();
    byMode.hybrid.forEach(result => ids.add(result.id));
    byMode.bm25.forEach(result => ids.add(result.id));
    byMode.vector.forEach(result => ids.add(result.id));

    return Array.from(ids).slice(0, topK).map((id) => {
      const hybrid = byMode.hybrid.find(result => result.id === id);
      const bm25 = byMode.bm25.find(result => result.id === id);
      const vector = byMode.vector.find(result => result.id === id);
      const parts = id.split(':');
      return {
        id,
        source: parts[0] ?? id,
        docHash: parts.length >= 3 ? parts[parts.length - 2] : '',
        chunkIndex: parts.length >= 3 ? parts[parts.length - 1] : '',
        hybridRank: hybrid?.rank ?? null,
        bm25Rank: bm25?.rank ?? null,
        vectorRank: vector?.rank ?? null,
      };
    });
  }, [runs, topK]);
}

function useBestStrategy(report: EvaluationReport | null, metric: keyof StrategyMetrics): RetrievalStrategy | null {
  return useMemo(() => {
    if (!report) return null;
    let best: RetrievalStrategy | null = null;
    let value = -Infinity;
    for (const strategy of STRATEGIES) {
      const candidate = report.strategies[strategy]?.averages?.[metric];
      if (typeof candidate === 'number' && candidate > value) {
        value = candidate;
        best = strategy;
      }
    }
    return best;
  }, [report, metric]);
}

function getSearchModeColor(mode: ExplorerMode) {
  switch (mode) {
    case 'bm25': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'vector': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'hybrid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'compare': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  }
}

function getMetricAccent(accent: 'cyan' | 'emerald' | 'blue' | 'amber' | 'violet') {
  switch (accent) {
    case 'cyan': return 'inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-300';
    case 'emerald': return 'inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300';
    case 'blue': return 'inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300';
    case 'amber': return 'inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300';
    case 'violet': return 'inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300';
  }
}

function formatSourceScope(sourceIds?: string[] | null) {
  return sourceIds && sourceIds.length > 0 ? sourceIds.join(', ') : 'Todas las fuentes';
}

function syncQueryScope(
  selectedQuery: { query: string; source_ids?: string[] | null },
  setQuery: (query: string) => void,
  setSourceScope: (scope: SourceScope) => void,
  setSelectedSourceIds: (sourceIds: string[]) => void,
) {
  setQuery(selectedQuery.query);
  if (selectedQuery.source_ids && selectedQuery.source_ids.length > 0) {
    setSourceScope('selected');
    setSelectedSourceIds(selectedQuery.source_ids);
    return;
  }
  setSourceScope('all');
  setSelectedSourceIds([]);
}

function formatMetric(value: number | undefined) {
  return typeof value === 'number' ? value.toFixed(3) : '—';
}
