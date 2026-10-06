# TaskFlow Backend API

Phase 1 Foundation: NestJS + TypeScript (strict) + Prisma ORM + Supabase Postgres + Redis.

---

## 1. Prerequisites

- **Node.js**: >= 18.x (v22+ supported)
- **Docker**: For running local Redis
- **Supabase Project**: Postgres database with connection pooling enabled

---

## 2. Setup & Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your real Supabase connection strings and secrets in `.env`:

- `DATABASE_URL`: Pooled connection string (`port 6543`, `?pgbouncer=true`)
- `DIRECT_URL`: Direct connection string (`port 5432`) for migrations
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `JWT_ACCESS_SECRET`: Minimum 16 characters
- `JWT_REFRESH_SECRET`: Minimum 16 characters
- `REDIS_URL`: `redis://localhost:6379`
- `GEMINI_API_KEY`: Google Gemini API key
- `CORS_ORIGIN`: Allowed frontend origin (`http://localhost:5173`)
- `PORT`: `3001`

---

## 3. Start Local Redis

```bash
docker-compose up -d
```

---

## 4. Install Dependencies & Generate Prisma Client

```bash
npm install
npm run prisma:generate
```

---

## 5. Run Database Migrations

Apply the Prisma migrations (including the schema tables and Row Level Security enablement):

```bash
npm run prisma:migrate:deploy
```

Or for development:

```bash
npm run prisma:migrate:dev
```

---

## 6. Run the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## 7. Verification Endpoints

- **Health Check**: `GET http://localhost:3001/health` (Returns `{ status: "ok", database: "connected" }`)
- **OpenAPI Swagger Docs**: `GET http://localhost:3001/docs`

---

## 8. Run Tests & Linter

```bash
# Unit & Config Validation Tests
npm run test

# End-to-End Tests
npm run test:e2e

# Code Quality & Format
npm run lint
npm run format
```
