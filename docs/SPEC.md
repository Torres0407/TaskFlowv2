# TaskFlow Backend Spec

Source of truth for the backend. Read together with:
- `docs/API_CONTRACT.md` (every frontend `api.*` function and its REST route)
- `docs/ASSISTANT_CONTRACT.md` (assistant tools and proposal flow)
- `src/types/index.ts` (frontend types, the shape of API responses)

If these documents disagree, this spec wins. Flag the conflict instead of guessing.

## 1. Stack

- NestJS + TypeScript (strict), in `backend/`
- Prisma ORM, Supabase hosted PostgreSQL
- Supabase Storage (private bucket `attachments`) with signed upload/download URLs
- Redis (Docker Compose locally) for rate limiting, Socket.IO adapter, idempotency keys
- Auth is fully custom in NestJS. Do NOT use Supabase Auth.
- Validation: class-validator DTOs (whitelist + forbidNonWhitelisted)
- Docs: OpenAPI via @nestjs/swagger on every endpoint
- Tests: Jest + Supertest (e2e), real Postgres for e2e

## 2. Environment variables

`.env` is never committed. Provide `.env.example` with placeholders only.

| Var | Purpose |
|---|---|
| DATABASE_URL | Supabase pooled connection (with `?pgbouncer=true`) for the running app |
| DIRECT_URL | Supabase direct connection, used by Prisma migrations only |
| SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | Storage signed URLs. Server only. Never sent to the client |
| JWT_ACCESS_SECRET, JWT_REFRESH_SECRET | Token signing |
| REDIS_URL | Redis |
| GEMINI_API_KEY | Assistant (Phase 8). Server only |
| CORS_ORIGIN | Allowed frontend origin |

Validate all of these at startup and fail fast if any is missing.

## 3. Data model

Every tenant-owned table has `orgId` and an index starting with `orgId`.

Enums (Prisma, uppercase): `Role {OWNER, ADMIN, MEMBER}`, `TaskStatus {TODO, IN_PROGRESS, DONE}`, `TaskPriority {LOW, MEDIUM, HIGH, URGENT}`, `ActionStatus {PENDING, APPROVED, REJECTED, EXPIRED}`, `Source {USER, ASSISTANT}`.

Frontend uses lowercase (`in_progress`, `urgent`). Map in ONE place: a mapper in the DTO/serialization layer. Nowhere else.

| Entity | Fields |
|---|---|
| User | id, email (unique), passwordHash, name, avatarUrl, createdAt |
| Organization | id, name, slug (unique), timezone (IANA, e.g. Africa/Lagos, default UTC), createdAt |
| Membership | id, userId, orgId, role. Unique (userId, orgId) |
| Invitation | id, orgId, email, role, tokenHash, expiresAt, acceptedAt, revokedAt, invitedById |
| Project | id, orgId, key (unique per org), name, description, leadId, archivedAt |
| Task | id, orgId, projectId, number (per project), title, description, status, priority, assigneeId, dueDate, position (float/decimal), createdById, source, createdAt, updatedAt |
| Comment | id, orgId, taskId, authorId, body, source, createdAt |
| Attachment | id, orgId, taskId, uploadedById, fileName, mimeType, size, storageKey |
| Notification | id, orgId, userId, type, payload (JSON), readAt, createdAt |
| RefreshToken | id, userId, familyId, tokenHash, expiresAt, revokedAt |
| AssistantAction | id, orgId, userId, type, payload (JSON), status, expiresAt, resolvedAt, resultEntityId |

Task `key` shown in the UI (e.g. `CLD-105`) = `project.key + "-" + task.number`.

## 4. Multi-tenancy rules (non-negotiable)

1. All tenant routes live under `/orgs/:orgId/...`.
2. `MembershipGuard` loads the caller's membership for `:orgId` on every request. Non-members get 404 (not 403) to avoid leaking existence.
3. `orgId` is NEVER read from a request body or query. Only from the route, after the guard.
4. Every Prisma query on a tenant table includes `orgId` in `where`. Child IDs from the client (projectId, taskId, assigneeId) are verified to belong to the route's org.
5. `RolesGuard` + `@Roles()` decorator for permissions.
6. Enable RLS on all tables with no public policies, so Supabase's auto-generated API exposes nothing. The API connects as the owner role, so guards and scoping are the real protection.
7. Required tests: user A in org 1 gets 404 on org 2's orgs, projects, tasks, comments, attachments, notifications, and assistant actions.

## 5. Permissions

| Action | Owner | Admin | Member |
|---|---|---|---|
| Delete org, transfer ownership | yes | no | no |
| Update org settings | yes | yes | no |
| Invite, remove members, change roles | yes | yes (cannot touch Owners) | no |
| Create / update / archive projects | yes | yes | no |
| Create / edit / move tasks | yes | yes | yes |
| Delete task | yes | yes | own only |
| Comment, attach files | yes | yes | yes |
| Delete attachment | yes | yes | own only |

Rules: an org always has at least one Owner. Block removing or demoting the last Owner.

## 6. Auth

- Access token: JWT, ~15 min. Refresh token: opaque random, rotating, stored hashed, sent as httpOnly + Secure + SameSite cookie.
- Refresh token reuse detection: if a revoked token is presented, revoke the whole `familyId`.
- Passwords: argon2id. Rate-limit auth routes (Redis). Generic error messages on login failure.
- Invitations: random token, store only the hash, expire in 7 days, single use. Accepting requires a logged-in user whose email matches the invitation.

## 7. API surface

Follow `docs/API_CONTRACT.md` for exact function-to-route mapping. Summary:

- Auth: `POST /auth/signup | login | refresh | logout`, `GET /auth/me`
- Orgs: `POST /orgs`, `GET /orgs`, `GET|PATCH|DELETE /orgs/:orgId`
- Members: `GET /orgs/:orgId/members`, `PATCH|DELETE /orgs/:orgId/members/:id`
- Invitations: `POST|GET /orgs/:orgId/invitations`, `DELETE /orgs/:orgId/invitations/:id` (revoke), `POST /invitations/:token/accept`
- Projects: CRUD + archive under `/orgs/:orgId/projects`
- Tasks: CRUD under `/orgs/:orgId/projects/:projectId/tasks`, `PATCH .../tasks/:id/move`
- Comments: `GET|POST .../tasks/:id/comments`
- Attachments: `POST .../attachments/upload-url`, `POST .../attachments` (confirm), `DELETE .../attachments/:id`
- Notifications: `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`

Pagination on all list endpoints (cursor or limit/offset, max 100).

## 8. Task ordering (gapped positions)

- `position` is a float/decimal. New tasks go to the bottom: `max + 1000`.
- Move request: `{ status, afterTaskId? , beforeTaskId?, placement? }`. Server computes position:
  - between two cards: midpoint
  - `placement: top`: `min - 1000`; `bottom`: `max + 1000`
- When the gap between neighbors falls below a threshold, rebalance that column in one transaction.
- Moves write one row in the normal case. Wrap rebalance in a transaction.

## 9. Real-time (Phase 5)

- Socket.IO gateway, authenticate on connection with the access token.
- Join rooms `org:{orgId}` and `project:{projectId}` only after a membership check.
- Redis adapter for multi-instance.
- Events: `task.created|updated|moved|deleted`, `comment.created`, `notification.created`.
- Every emitted event also writes `Notification` rows for the relevant users (assignee, mentioned, etc.), never for the actor.

## 10. Assistant (Phase 8, after everything else)

- `POST /orgs/:orgId/assistant/chat` behind `MembershipGuard`.
- Accept only `user` messages from the client. Cap message count and length.
- Tools (read): `list_projects`, `list_tasks`, `search_tasks`, `get_overdue_tasks`, `get_project_summary`, `list_members`, `get_task`. They call existing services with the caller's identity and `orgId`. Max 50 rows, minimal fields, `truncated` flag.
- Tools (write) never execute. They create an `AssistantAction` (PENDING, expires in 15 min) and return it.
- `POST /orgs/:orgId/assistant/actions/:id/approve|reject`: the action must belong to that user and org, and still be PENDING. Run the normal service with the user's real role, set `source = ASSISTANT` on the result, mark APPROVED. Approve is idempotent.
- Payload validated with the same DTOs as the normal endpoints, whitelist only (`title, description, priority, status, assigneeId, dueDate`). Never `orgId`, `id`, `createdById`.
- System prompt gets the current date and the org's `timezone`.
- Task titles, descriptions, and comments are untrusted data, never instructions.
- Rate limit per user per org in Redis, plus a daily org cap.

## 11. Build phases (stop after each for review)

1. **Foundation:** scaffold, config validation, Prisma schema + first migration against Supabase, Docker Compose (Redis), health endpoint, `.env.example`.
2. **Auth and tenancy:** signup/login/refresh/logout, orgs, memberships, guards, role rules, cross-tenant isolation tests.
3. **Core domain:** projects, tasks (with positions and move), comments, OpenAPI, e2e tests.
4. **Files and invites:** Supabase Storage signed URLs, invitation create/accept/revoke.
5. **Real-time and notifications.**
6. **Frontend integration:** port UI to Next.js App Router, replace `api.ts` internals with real HTTP calls (React Query), typed client from OpenAPI.
7. **Quality and ops:** CI (lint, test, build), Dockerfile, README with architecture diagram, deployment.
8. **Assistant.**

Definition of done per phase: builds clean, lint passes, tests pass (including tenant-isolation tests from Phase 2 onward), OpenAPI updated, commit with a clear message.
