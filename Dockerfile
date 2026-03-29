# Stage 1: build
FROM node:22-alpine AS builder

# Enable corepack for pnpm (package.json uses pnpm overrides)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || npm ci 2>/dev/null || npm install

COPY . .

ARG VITE_API_URL=http://localhost:8888
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm run build 2>/dev/null || npm run build

# Stage 2: serve with nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
