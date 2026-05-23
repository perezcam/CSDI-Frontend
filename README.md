# CSDI Frontend

Interfaz web para operar y evaluar un sistema RAG de búsqueda inteligente. La aplicación permite conversar con la base de conocimiento indexada, explorar distintos métodos de recuperación, gestionar fuentes, cargar documentos, monitorear métricas del índice y ajustar parámetros del pipeline desde una UI única.

## Tabla de contenido

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Configuración](#configuración)
- [Ejecución local](#ejecución-local)
- [Ejecución con Docker](#ejecución-con-docker)
- [Pantallas principales](#pantallas-principales)
- [Integración con el backend](#integración-con-el-backend)
- [Scripts disponibles](#scripts-disponibles)
- [Notas de desarrollo](#notas-de-desarrollo)

## Características

- Chat RAG con respuestas en Markdown y fuentes recuperadas.
- Explorador de búsqueda híbrida, BM25 y vectorial.
- Comparación de estrategias de retrieval.
- Flujo de evaluación IR con consultas guardadas, juicios de relevancia y métricas como Precision, Recall, F1, MRR y NDCG.
- Gestión de fuentes configuradas e ingestión desde el backend.
- Carga de archivos y URLs para ampliar la base de conocimiento.
- Dashboard de salud, métricas del índice y modelos activos.
- Panel de configuración para pesos de búsqueda, LLM, reranker, HyDE y criterios de insuficiencia.

## Stack tecnológico

- React 18
- TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- Radix UI
- Lucide React
- Material UI Icons
- Recharts
- Sonner
- Nginx para servir la build de producción

## Estructura del proyecto

```text
.
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── vite.config.ts
└── src
    ├── app
    │   ├── components      # Layout y componentes UI
    │   ├── context         # Contextos de aplicación
    │   ├── pages           # Pantallas principales
    │   └── routes.ts       # Rutas SPA
    ├── hooks               # Hooks de estado y datos
    ├── lib                 # Cliente HTTP y utilidades
    ├── services            # Servicios contra el backend
    ├── styles              # CSS global, Tailwind y tema
    └── types               # Tipos compartidos de API
```

## Requisitos

- Node.js 20 o superior. La imagen Docker usa Node 22.
- npm 10 o superior.
- Backend RAG disponible. Por defecto se espera en `http://localhost:8888`.

## Configuración

La aplicación lee variables de entorno de Vite. Crea o ajusta el archivo `.env`:

```env
VITE_API_URL=http://localhost:8888
FRONTEND_PORT=5173
```

Variables disponibles:

| Variable | Uso | Valor por defecto |
| --- | --- | --- |
| `VITE_API_URL` | URL base del backend RAG. Se usa en todas las llamadas HTTP. | `http://localhost:8888` |
| `FRONTEND_PORT` | Puerto expuesto por Docker Compose. | `3000` |

Importante: las variables `VITE_*` se inyectan en tiempo de build. Si cambias `VITE_API_URL` para una imagen Docker, reconstruye el contenedor.

## Ejecución local

Instala dependencias:

```bash
npm install
```

Arranca el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará la URL local, normalmente:

```text
http://localhost:5173
```

Genera una build de producción:

```bash
npm run build
```

## Ejecución con Docker

Levanta el frontend con Docker Compose:

```bash
docker compose up --build
```

Con el `.env` actual, la aplicación queda disponible en:

```text
http://localhost:5173
```

Si no defines `FRONTEND_PORT`, Docker Compose publica el contenedor en:

```text
http://localhost:3000
```

El contenedor compila la app con Node y sirve los archivos estáticos con Nginx. La configuración de Nginx incluye fallback a `index.html` para soportar rutas SPA.

## Pantallas principales

| Ruta | Pantalla | Propósito |
| --- | --- | --- |
| `/` | Chat CSDI | Consulta la base de conocimiento y muestra fuentes recuperadas. |
| `/search` | Explorador de búsqueda | Prueba BM25, vectorial, híbrida y comparación de estrategias. También gestiona evaluación IR. |
| `/sources` | Fuentes de conocimiento | Lista fuentes configuradas, muestra chunks indexados y dispara ingestión. |
| `/knowledge` | Conocimiento | Sube archivos o añade URLs para ingestión. |
| `/dashboard` | Dashboard del sistema | Revisa salud del backend, métricas del índice y modelos activos. |
| `/settings` | Configuración | Ajusta parámetros persistibles del pipeline RAG. |

## Integración con el backend

El cliente HTTP está en `src/lib/api.ts` y construye las URLs con `VITE_API_URL`.

Endpoints consumidos por la UI:

| Módulo | Método | Endpoint |
| --- | --- | --- |
| Salud | `GET` | `/health` |
| Métricas | `GET` | `/api/v1/metrics` |
| Chat | `POST` | `/api/v1/rag/query` |
| Chat | `GET` | `/api/v1/rag/history/:sessionId` |
| Búsqueda híbrida | `POST` | `/api/v1/search` |
| Búsqueda BM25 | `POST` | `/api/v1/search/bm25` |
| Búsqueda vectorial | `POST` | `/api/v1/vector/search` |
| Fuentes | `GET` | `/api/v1/ingest/sources` |
| Ingestión | `POST` | `/api/v1/ingest` |
| Upload | `POST` | `/api/v1/upload` |
| Configuración | `GET` | `/api/v1/config` |
| Configuración | `POST` | `/api/v1/config` |
| Evaluación | `GET` | `/api/v1/evaluation/queries` |
| Evaluación | `POST` | `/api/v1/evaluation/queries` |
| Evaluación | `POST` | `/api/v1/evaluation/queries/:queryId/rankings` |
| Evaluación | `GET` | `/api/v1/evaluation/queries/:queryId/rankings` |
| Evaluación | `PUT` | `/api/v1/evaluation/queries/:queryId/judgments/:chunkId` |
| Evaluación | `GET` | `/api/v1/evaluation/queries/:queryId/judgments` |
| Evaluación | `POST` | `/api/v1/evaluation/run` |
| Evaluación | `GET` | `/api/v1/evaluation/report` |
| Evaluación | `GET` | `/api/v1/evaluation/summary` |

El backend debe permitir CORS desde el origen donde se sirva este frontend.

## Scripts disponibles

```bash
npm run dev
```

Inicia Vite en modo desarrollo.

```bash
npm run build
```

Compila la aplicación para producción en `dist/`.

Actualmente el proyecto no define scripts de lint ni tests en `package.json`.

## Notas de desarrollo

- Las rutas se definen en `src/app/routes.ts`.
- Los servicios HTTP viven en `src/services`.
- Los tipos esperados del backend están en `src/types/api.ts`.
- El alias `@` apunta a `src`, definido en `vite.config.ts`.
- La UI usa una paleta oscura y componentes reutilizables bajo `src/app/components/ui`.
- Para producción, modifica `VITE_API_URL` antes de construir la imagen o la build estática.

