# App de Agroecologia

Projeto web (React + Vite) com API em Node/Express e banco PostgreSQL.

## Rodando local

1. Instale dependências:
`npm i`

2. Crie `.env` baseado em `.env.example`.

3. Rode as migrações:
`npm run db:migrate`

4. Suba frontend + API:
`npm run dev`

## Deploy gratuito (Neon + Render + Cloudflare Pages)

### 1) Banco no Neon

- Crie o projeto no Neon e copie a `DATABASE_URL`.
- Rode migrações apontando para o Neon:
`npm run db:migrate`

### 2) API no Render (Web Service)

- Conecte seu repositório no Render.
- Configure:
`Build Command: npm ci --include=dev`
`Start Command: npm run start:api`

- Variáveis de ambiente no Render:
`DATABASE_URL=...` (string do Neon)
`DATABASE_SSL=true`
`DATABASE_SSL_REJECT_UNAUTHORIZED=true`
`CORS_ORIGINS=https://SEU_FRONT.pages.dev,http://localhost,capacitor://localhost`

Observação: após vincular domínio customizado, adicione também esse domínio no `CORS_ORIGINS`.

### 3) Frontend no Cloudflare Pages

- Conecte o mesmo repositório no Cloudflare Pages.
- Build settings:
`Build command: npm run build`
`Output directory: build`

- Variável de ambiente no Pages:
`VITE_API_BASE_URL=https://SUA-API.onrender.com`

### 4) Gerar APK usando API em produção

`VITE_API_BASE_URL=https://SUA-API.onrender.com npm run mobile:android`
`npm run apk:debug`
