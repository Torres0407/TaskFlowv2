export type UserRole = 'Owner' | 'Admin' | 'Member';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  role: UserRole;
  title?: string;
  joinedAt?: string;
  twoFactorEnabled?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  plan: 'Starter' | 'Growth' | 'Enterprise';
  timezone: string; // IANA timezone string, e.g. 'Africa/Lagos', 'America/New_York'
  currentRole: UserRole;
  membersCount: number;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  key: string; // e.g. "PRJ", "DES"
  description: string;
  color: string;
  leadId: string;
  status: 'active' | 'completed' | 'archived';
  dueDate: string; // ISO date string
  createdAt: string; // ISO timestamp string
  memberIds: string[];
}

// Prisma-compatible TaskStatus enum (UPPERCASE)
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type Placement = 'top' | 'bottom';

// Enum mapping utilities
export const normalizeTaskStatus = (status: string): TaskStatus => {
  const s = String(status || '').trim().toUpperCase();
  if (s === 'IN_PROGRESS' || s === 'INPROGRESS' || s === 'IN-PROGRESS' || s === 'PROGRESS') {
    return 'IN_PROGRESS';
  }
  if (s === 'DONE' || s === 'COMPLETED') {
    return 'DONE';
  }
  return 'TODO';
};

export const taskStatusToDisplay = (status: TaskStatus | string): string => {
  const norm = normalizeTaskStatus(status);
  switch (norm) {
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'DONE':
      return 'Done';
    case 'TODO':
    default:
      return 'To Do';
  }
};

export interface Attachment {
  id: string;
  orgId: string;
  taskId: string;
  name: string;
  size: string;
  type: string; // e.g., 'image/png', 'application/pdf', 'figma'
  uploadedAt: string; // ISO timestamp string
  uploaderName: string;
  url?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresInSeconds: number;
}

export interface Comment {
  id: string;
  orgId: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorInitials: string;
  content: string;
  createdAt: string; // ISO timestamp string
}

export interface Task {
  id: string;
  key: string; // e.g. "PRJ-102"
  projectId: string;
  orgId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  createdById: string;
  position: number; // Order index for column positioning
  dueDate: string; // ISO date string (YYYY-MM-DD or full ISO)
  tags: string[];
  comments: Comment[];
  attachments: Attachment[];
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// Renamed to NotificationItem to avoid conflict with browser global Notification
export interface NotificationItem {
  id: string;
  orgId?: string;
  title: string;
  description: string;
  timestamp: string; // ISO date or relative label
  read: boolean;
  type: 'mention' | 'assignment' | 'deadline' | 'team';
  projectId?: string;
  taskId?: string;
}

export interface Membership {
  id: string;
  orgId: string;
  user: User;
  role: UserRole;
  joinedDate: string; // ISO date or formatted date
  status: 'active' | 'invited';
}

export interface Invitation {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: string; // ISO timestamp string
  acceptedAt: string | null; // ISO timestamp string or null
}
