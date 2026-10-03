# TaskFlow API Contract & REST Specification

This document defines the interface signatures for `src/services/api.ts` and maps each client method to its corresponding standard RESTful backend endpoint.

All tenant-scoped endpoints require `orgId` as the primary scoping identifier in the route path (`/api/v1/orgs/:orgId/...`).

---

## 1. Authentication & Users (`api.auth`)

| Method Signature | HTTP & Route | Description |
| :--- | :--- | :--- |
| `getCurrentUser(): Promise<User \| null>` | `GET /api/v1/auth/me` | Fetches the authenticated user profile based on the session/bearer token. |
| `getUsers(): Promise<User[]>` | `GET /api/v1/users` | Lists user directory profiles for assignee selectors and avatar rendering. |
| `login(email: string, role?: UserRole): Promise<{ user: User; token: string }>` | `POST /api/v1/auth/login` | Authenticates an existing user and returns a session JWT. |
| `signup(name: string, email: string, orgName: string): Promise<{ user: User; organization: Organization; token: string }>` | `POST /api/v1/auth/signup` | Registers a new founder account and initializes the root organization. |
| `logout(): Promise<void>` | `POST /api/v1/auth/logout` | Invalidates active session cookies/tokens. |

---

## 2. Organizations (`api.orgs`)

| Method Signature | HTTP & Route | Description |
| :--- | :--- | :--- |
| `list(): Promise<Organization[]>` | `GET /api/v1/orgs` | Returns all organizations the current authenticated user belongs to. |
| `getById(id: string): Promise<Organization \| null>` | `GET /api/v1/orgs/:id` | Returns organization details, tier, and member counts. |
| `create(name: string): Promise<Organization>` | `POST /api/v1/orgs` | Provisions a new workspace organization with the caller as Owner. |
| `update(orgId: string, updates: Partial<Organization>): Promise<Organization>` | `PATCH /api/v1/orgs/:orgId` | Modifies organization name, slug, or tier settings. |
| `delete(orgId: string): Promise<{ success: boolean; orgId: string }>` | `DELETE /api/v1/orgs/:orgId` | Deletes an entire workspace organization and cascades all data. |

---

## 3. Projects (`api.projects`)

| Method Signature | HTTP & Route | Description |
| :--- | :--- | :--- |
| `list(orgId: string): Promise<Project[]>` | `GET /api/v1/orgs/:orgId/projects` | Lists all active and archived projects within the tenant workspace. |
| `getById(orgId: string, projectId: string): Promise<Project \| null>` | `GET /api/v1/orgs/:orgId/projects/:projectId` | Fetches single project metadata by key or ID. |
| `create(orgId: string, data: ProjectInput): Promise<Project>` | `POST /api/v1/orgs/:orgId/projects` | Creates a new project with lead assignee, key prefix, and accent color. |
| `update(orgId: string, projectId: string, updates: Partial<Project>): Promise<Project>` | `PATCH /api/v1/orgs/:orgId/projects/:projectId` | Updates project name, description, due date, or lead. |
| `archive(orgId: string, projectId: string): Promise<Project>` | `POST /api/v1/orgs/:orgId/projects/:projectId/archive` | Sets project status to archived without deleting task history. |

---

## 4. Tasks & Kanban Reordering (`api.tasks`)

| Method Signature | HTTP & Route | Description |
| :--- | :--- | :--- |
| `list(orgId: string, filter?: { projectId?: string }): Promise<Task[]>` | `GET /api/v1/orgs/:orgId/tasks` | Returns tasks filtered optionally by `projectId`. |
| `create(orgId: string, data: TaskInput): Promise<Task>` | `POST /api/v1/orgs/:orgId/tasks` | Creates a new task and appends it to the specified column position. |
| `update(orgId: string, taskId: string, updates: Partial<Task>): Promise<Task>` | `PATCH /api/v1/orgs/:orgId/tasks/:taskId` | Updates title, description, assignee, priority, or due date. |
| `move(orgId: string, taskId: string, params: { status: TaskStatus; position: number }): Promise<Task[]>` | `PATCH /api/v1/orgs/:orgId/tasks/:taskId/position` | Reorders task within a column or transfers to target column at index `position`. Returns updated project tasks. |
| `delete(orgId: string, taskId: string): Promise<{ success: boolean; taskId: string }>` | `DELETE /api/v1/orgs/:orgId/tasks/:taskId` | Deletes a task along with comments and attachment associations. |

---

## 5. Comments (`api.comments`)

| Method Signature | HTTP & Route | Description |
| :--- | :--- | :--- |
| `list(orgId: string, taskId: string): Promise<Comment[]>` | `GET /api/v1/orgs/:orgId/tasks/:taskId/comments` | Retrieves all activity comments for the task in chronological order. |
| `add(orgId: string, taskId: string, data: CommentInput): Promise<Comment>` | `POST /api/v1/orgs/:orgId/tasks/:taskId/comments` | Appends a new timestamped comment attributed to the active user. |

---

## 6. Attachments (Two-Step Upload Flow) (`api.attachments`)

| Method Signature | HTTP & Route | Description |
| :--- | :--- | :--- |
| `createUploadUrl(orgId: string, taskId: string, fileMeta: FileMeta): Promise<UploadUrlResponse>` | `POST /api/v1/orgs/:orgId/tasks/:taskId/attachments/upload-url` | **Step 1**: Generates a pre-signed cloud storage URL (`PUT`) and a unique `fileKey`. |
| `confirm(orgId: string, taskId: string, metadata: ConfirmInput): Promise<Attachment>` | `POST /api/v1/orgs/:orgId/tasks/:taskId/attachments/confirm` | **Step 2**: Confirms file binary was transferred successfully and persists attachment record. |
| `delete(orgId: string, taskId: string, attachmentId: string): Promise<{ success: boolean; attachmentId: string }>` | `DELETE /api/v1/orgs/:orgId/tasks/:taskId/attachments/:attachmentId` | Removes attachment record and deletes underlying binary from cloud bucket. |

---

## 7. Memberships & Governance (`api.members`)

| Method Signature | HTTP & Route | Description |
| :--- | :--- | :--- |
| `list(orgId: string): Promise<Membership[]>` | `GET /api/v1/orgs/:orgId/members` | Returns all active workspace memberships and their assigned roles. |
| `updateRole(orgId: string, memberId: string, role: UserRole): Promise<Membership>` | `PATCH /api/v1/orgs/:orgId/members/:memberId/role` | Promotes or demotes member role (`Owner`, `Admin`, `Member`). |
| `remove(orgId: string, memberId: string): Promise<{ success: boolean; memberId: string }>` | `DELETE /api/v1/orgs/:orgId/members/:memberId` | Revokes workspace access and removes membership. |

---

## 8. Invitations (`api.invitations`)

| Method Signature | HTTP & Route | Description |
| :--- | :--- | :--- |
| `list(orgId: string): Promise<Invitation[]>` | `GET /api/v1/orgs/:orgId/invitations` | Lists all unaccepted/pending invitations for the organization. |
| `create(orgId: string, data: { email: string; role: UserRole }): Promise<Invitation>` | `POST /api/v1/orgs/:orgId/invitations` | Creates a pending invitation with a unique security token and expiration. |
| `revoke(orgId: string, invitationId: string): Promise<{ success: boolean; invitationId: string }>` | `DELETE /api/v1/orgs/:orgId/invitations/:invitationId` | Cancels an unaccepted invitation before expiration. |
| `accept(token: string): Promise<{ membership: Membership; user: User }>` | `POST /api/v1/invitations/accept` | Public endpoint validating invitation token, creating the active user and membership. |

---

## 9. Notifications (`api.notifications`)

| Method Signature | HTTP & Route | Description |
| :--- | :--- | :--- |
| `list(orgId: string): Promise<NotificationItem[]>` | `GET /api/v1/orgs/:orgId/notifications` | Returns user notifications scoped to the current tenant. |
| `markRead(orgId: string, id: string): Promise<NotificationItem>` | `PATCH /api/v1/orgs/:orgId/notifications/:id/read` | Marks a specific notification item as read. |
| `markAllRead(orgId: string): Promise<NotificationItem[]>` | `POST /api/v1/orgs/:orgId/notifications/read-all` | Marks all tenant notifications as read. |
