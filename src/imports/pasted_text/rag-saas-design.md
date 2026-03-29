Diseña una aplicación web SaaS moderna, elegante y técnica para una plataforma RAG (Retrieval-Augmented Generation) enfocada en búsqueda inteligente, consulta con LLM, observabilidad del retrieval y gestión del conocimiento.

La interfaz debe sentirse como una herramienta profesional para ingeniería, producto y operaciones, con una estética visual inspirada en herramientas como Codex, Vercel, Linear y dashboards modernos para desarrolladores.

IMPORTANTE:
- Todo el contenido visual y textual debe estar en español
- Toda la interfaz debe usar una paleta oscura
- Predominar tonos azul oscuro, gris grafito, gris azulado y acentos sutiles en azul frío
- El look & feel debe ser premium, sobrio, técnico y moderno
- Debe transmitir precisión, control y robustez
- Nada colorido ni excesivamente llamativo
- Muy buena jerarquía visual, espaciado limpio y componentes elegantes

Estilo visual:
- Dark mode sofisticado
- Fondos en azul muy oscuro, gris carbón y gris azulado
- Cards oscuras con bordes suaves y contraste limpio
- Tipografía moderna sans-serif
- Tablas, paneles laterales, badges y toggles con estética minimalista
- Sombras suaves, bordes redondeados, UI muy pulida
- Apariencia de producto enterprise listo para producción
- Diseño desktop-first, responsive
- Componentes reutilizables y consistentes

Diseña estas 6 pantallas principales:

1. Chat / Consulta RAG
Objetivo:
Pantalla principal para hacer preguntas al sistema y recibir respuestas generadas por el LLM con respaldo en fuentes recuperadas.

Elementos:
- Header superior con nombre del producto y navegación
- Área central de conversación
- Input grande para escribir la pregunta
- Botón “Enviar”
- Historial de conversación de la sesión
- Respuesta del LLM renderizada en markdown
- Panel lateral derecho con las fuentes utilizadas
- Cada fuente debe mostrar:
  - título
  - URL
  - fragmento del chunk
  - score o relevancia
- Estados visuales de carga mientras se genera la respuesta
- Diferenciación clara entre mensajes del usuario y respuestas del sistema

Deseo visual:
- Interfaz tipo chat profesional
- Mucha claridad en la trazabilidad de fuentes
- Sensación de IA confiable y auditable

2. Explorador de Búsqueda
Objetivo:
Pantalla para probar retrieval sin pasar por el LLM, útil para depurar la calidad de búsqueda.

Elementos:
- Input de búsqueda
- Control de modo de recuperación:
  - BM25 solo
  - Vector solo
  - Híbrido
- Slider de top_k
- Lista de resultados ordenados
- Cada resultado debe mostrar:
  - score
  - título
  - URL
  - texto del chunk
  - colección o fuente
- Badges para identificar el tipo de recuperación
- Vista clara para entender por qué ciertos resultados aparecen arriba

Deseo visual:
- Estética de herramienta de diagnóstico
- Muy legible
- Sensación de consola analítica elegante

3. Fuentes de Conocimiento
Objetivo:
Pantalla administrativa para ver y gestionar todas las fuentes ya indexadas en el sistema.

Elementos:
- Tabla o lista de fuentes configuradas
- Ejemplos:
  - python_docs
  - mdn_js
  - docs_internos
  - base_legal
- Por cada fuente mostrar:
  - nombre
  - páginas indexadas
  - chunks totales
  - fecha del último ingest
  - estado: indexando / listo / error
- Botón “Reindexar”
- Campo de búsqueda o filtro
- Indicadores visuales de estado

Deseo visual:
- Vista administrativa limpia y robusta
- Tabla moderna con estados claros
- Sensación de control del corpus de conocimiento

4. Conocimiento
Objetivo:
Pantalla para agregar nuevas fuentes al sistema y lanzar procesos de ingestión.

Elementos:
- Sección para subir archivos
  - Drag and drop
  - Botón “Seleccionar archivos”
  - Tipos visibles: PDF, DOCX, TXT, MD, HTML u otros documentos soportados
- Sección para agregar URLs de sitios web
  - Input para pegar una URL
  - Botón “Agregar URL”
- Lista de archivos o URLs agregados pendientes de ingestión
- Botón principal “Ingerir conocimiento”
- Estado por elemento:
  - pendiente
  - procesando
  - ingerido
  - error
- Posibilidad visual de agrupar por tipo: archivos / sitios web
- Indicadores de progreso de ingestión
- Diseño que deje claro que el usuario puede nutrir el corpus fácilmente

Deseo visual:
- Debe sentirse como una consola de administración de conocimiento
- Muy intuitiva pero técnica
- Limpia, robusta y confiable

5. Dashboard del Sistema
Objetivo:
Pantalla de monitoreo general del motor RAG.

Elementos:
- KPIs en cards:
  - total de chunks en base de datos
  - vectores en FAISS
  - documentos en BM25
  - modelo de embedding activo
  - modelo LLM activo
  - modelo re-ranker activo
- Indicador general de salud del sistema
- Posibles mini gráficos o métricas resumidas
- Estado de componentes principales
- Vista ejecutiva y técnica a la vez

Deseo visual:
- Dashboard técnico premium
- Cards limpias y elegantes
- Enfoque en monitoreo rápido y claridad operacional

6. Configuración
Objetivo:
Pantalla para ajustar el pipeline sin tocar código.

Elementos:
- Slider para pesos híbridos:
  - BM25 vs Neural IR
- Selector de modelo LLM
- Control de temperatura
- Toggle para re-ranker activado / desactivado
- Campo o slider para:
  - chunks de contexto del LLM
  - chunks candidatos para re-ranking
- Organización por secciones
- Microcopy explicativo breve en español para cada parámetro

Deseo visual:
- Pantalla de settings enterprise
- Configuración avanzada pero accesible
- UI moderna y muy consistente

Requisitos globales:
- Toda la navegación debe estar en español
- Proponer sidebar izquierda con navegación principal:
  - Chat
  - Explorador de búsqueda
  - Fuentes de conocimiento
  - Conocimiento
  - Dashboard del sistema
  - Configuración
- Incluir estados vacíos, loading, error y éxito
- Mantener consistencia visual total entre todas las vistas
- Usar componentes profesionales y reutilizables
- La interfaz debe parecer un producto real listo para desarrollo

Tono visual deseado:
- Oscuro
- Azul profundo
- Gris grafito
- Gris acero
- Acentos azules fríos
- Muy similar al lenguaje visual de herramientas para desarrolladores modernas
- Elegante, técnico, preciso y sobrio

Palabras clave de referencia:
plataforma RAG en español, dashboard oscuro premium, herramienta de búsqueda con IA, panel administrativo técnico, interfaz tipo Codex, developer SaaS dark blue, retrieval observability, enterprise AI workspace