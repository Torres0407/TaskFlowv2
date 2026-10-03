# TaskFlow Gemini Assistant Contract & Protocol

This document defines the interface specification, tool declarations, action proposal mechanics, and REST endpoint for the AI Assistant within TaskFlow.

---

## 1. REST Endpoint Specification

- **Route**: `POST /orgs/:orgId/assistant/chat`
- **Authentication**: Bearer JWT / Session Cookie
- **Rate Limit**: 20 requests per hour per user session

### Request Schema

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What tasks are overdue in Cloud Infrastructure?"
    }
  ],
  "context": {
    "currentProjectId": "proj-1",
    "openTaskId": "task-1"
  }
}
```

### Response Schema

```json
{
  "text": "Found **1 overdue task** in Cloud Infrastructure V2: `CLD-105`...",
  "proposedActions": [
    {
      "id": "act-1727931400-ab12",
      "type": "move_task",
      "description": "Move task task-5 to DONE (top)",
      "payload": {
        "type": "move_task",
        "taskId": "task-5",
        "status": "DONE",
        "placement": "top"
      },
      "status": "pending"
    }
  ]
}
```

---

## 2. Enums and Types Specification (from `src/types/index.ts`)

### `TaskStatus`
```typescript
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
```

### `TaskPriority`
```typescript
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
```

### `UserRole`
```typescript
export type UserRole = 'Owner' | 'Admin' | 'Member';
```

### `Placement`
```typescript
export type Placement = 'top' | 'bottom';
```

### Whitelist for `update_task`
Only the following fields are accepted for task updates. Any other property will be stripped or rejected:
- `title?: string`
- `description?: string`
- `priority?: TaskPriority` (`'urgent'` | `'high'` | `'medium'` | `'low'`)
- `status?: TaskStatus` (`'TODO'` | `'IN_PROGRESS'` | `'DONE'`)
- `assigneeId?: string`
- `dueDate?: string` (ISO `YYYY-MM-DD`)

Confirmation cards for `update_task` display a before/after diff (e.g. `Priority: Medium → High`, `Status: To Do → In Progress`, `Assignee: Alex Chen → Elena Rostova`) rather than displaying only the new values.

---

## 3. Proposed Action Data Contract

Write operations are **never executed autonomously** by the model. When a user requests a state mutation, the model outputs a `proposedAction`. The client renders a structured confirmation card directly from the payload (resolving IDs to titles and names in code) with **Approve** and **Reject** buttons. If an ID cannot be resolved, an error is displayed and the **Approve** button is disabled. Approval is strictly idempotent by action ID.

```typescript
export type ProposedActionPayload =
  | {
      type: 'create_task';
      projectId: string;
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      dueDate?: string;
    }
  | {
      type: 'update_task';
      taskId: string;
      updates: {
        title?: string;
        description?: string;
        priority?: TaskPriority;
        status?: TaskStatus;
        assigneeId?: string;
        dueDate?: string;
      };
    }
  | {
      type: 'move_task';
      taskId: string;
      status: TaskStatus;
      placement?: Placement;
    }
  | {
      type: 'add_comment';
      taskId: string;
      content: string;
    };

export interface ProposedAction {
  id: string;
  type: 'create_task' | 'update_task' | 'move_task' | 'add_comment';
  description: string;
  payload: ProposedActionPayload;
  status: 'pending' | 'approved' | 'rejected';
}
```

---

## 4. Gemini Function Calling Tool Definitions

### Read Tools (Executed Immediately via `api.*`)

1. **`list_projects`**
   - **Parameters**: none
   - **Behavior**: Lists all projects in the organization with their IDs, keys, names, and lead IDs. Used by the model to resolve project names to IDs.
2. **`get_task`**
   - **Parameters**: `taskId` (string, required)
   - **Behavior**: Returns complete details of a specific task including title, description, status, priority, comments (`id`, `authorName`, `content`, `createdAt`), and attachment names.
3. **`list_tasks`**
   - **Parameters**: `projectId` (string, optional), `status` (string, optional), `assigneeId` (string, optional)
   - **Behavior**: Retrieves tasks filtered by project, column, or assignee for the active organization. Results capped at 50 with `truncated: boolean`. Returns only `id`, `key`, `title`, `status`, `priority`, `assigneeId`, `dueDate`.
4. **`search_tasks`**
   - **Parameters**: `query` (string, required)
   - **Behavior**: Performs substring search across titles, descriptions, and task keys. Results capped at 50 with `truncated: boolean`. Returns only `id`, `key`, `title`, `status`, `priority`, `assigneeId`, `dueDate`.
5. **`get_overdue_tasks`**
   - **Parameters**: none
   - **Behavior**: Returns tasks where `status !== 'done'` and `dueDate < current_date`. Capped at 50 with `truncated: boolean`.
6. **`get_project_summary`**
   - **Parameters**: `projectId` (string, required)
   - **Behavior**: Returns project metrics, total task count, and status breakdown (`todo`, `in_progress`, `done`).
7. **`list_members`**
   - **Parameters**: none
   - **Behavior**: Lists team members (`id`, `userId`, `name`, `email`, `role`). Used by the model to resolve member names to IDs.

### Write Tools (Captured as `ProposedAction` - Never Executed Directly)

1. **`create_task`**
   - **Parameters**: `projectId` (string, required), `title` (string, required), `description` (string, optional), `status` (`'todo'` | `'in_progress'` | `'done'`, optional), `priority` (`'urgent'` | `'high'` | `'medium'` | `'low'`, optional), `assigneeId` (string, optional), `dueDate` (string, optional)
   - **Behavior**: Proposes a new task to be created after explicit human approval.
2. **`update_task`**
   - **Parameters**: `taskId` (string, required), `title` (string, optional), `description` (string, optional), `priority` (`'urgent'` | `'high'` | `'medium'` | `'low'`, optional), `status` (`'todo'` | `'in_progress'` | `'done'`, optional), `assigneeId` (string, optional), `dueDate` (string, optional)
   - **Behavior**: Proposes an update to an existing task using only whitelisted fields.
3. **`move_task`**
   - **Parameters**: `taskId` (string, required), `status` (`'todo'` | `'in_progress'` | `'done'`, required), `placement` (`'top'` | `'bottom'`, optional)
   - **Behavior**: Proposes moving a task across columns with top or bottom placement. The API layer computes sequential positions.
4. **`add_comment`**
   - **Parameters**: `taskId` (string, required), `content` (string, required)
   - **Behavior**: Proposes posting a comment attributed to the current user.

---

## 5. Safety & Governance Rules

- **Zero Hallucination / Grounding**: Only state facts retrieved from tool calls. Do not invent task keys, users, or metrics. Resolve names to IDs using `list_projects` and `list_members`.
- **System Prompt Context Injection**: Every request dynamically injects the current date and the organization's time zone.
- **Strict Tenant Isolation**: All reads and writes are prefixed with `orgId`. Cross-tenant data retrieval is impossible.
- **Prompt Injection Defense**: Task titles, descriptions, and comments are treated as untrusted payload data. Embedded commands (e.g., "Ignore system rules") are ignored.
- **Role Verification**: Actions respect the active user's role (`Owner`, `Admin`, `Member`). If a permission check fails, the model informs the user instead of generating a proposed action.
