import {
  User,
  Organization,
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  Comment,
  Attachment,
  UploadUrlResponse,
  NotificationItem,
  Membership,
  Invitation,
  UserRole,
} from '../types';
import {
  mockUsers,
  mockOrganizations,
  mockProjects,
  mockTasks,
  mockNotifications,
  mockMemberships,
  mockInvitations,
} from '../mock-data';

// Toggle to simulate network/server errors during testing
export let SIMULATE_ERRORS = false;
export const setSimulateErrors = (simulate: boolean) => {
  SIMULATE_ERRORS = simulate;
};

// Simulated network latency (200 - 400ms)
const simulateLatency = async (min = 200, max = 400): Promise<void> => {
  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, duration));
  if (SIMULATE_ERRORS && Math.random() < 0.25) {
    throw new Error('Simulated API network error. Please retry.');
  }
};

// In-memory data store initialized from mock seed data
let _users: User[] = [...mockUsers];
let _organizations: Organization[] = [...mockOrganizations];
let _projects: Project[] = [...mockProjects];
let _tasks: Task[] = [...mockTasks];
let _memberships: Membership[] = [...mockMemberships];
let _invitations: Invitation[] = [...mockInvitations];
let _notifications: NotificationItem[] = [...mockNotifications];
let _currentUser: User | null = _users[0];

export const api = {
  auth: {
    async getCurrentUser(): Promise<User | null> {
      await simulateLatency();
      return _currentUser ? { ..._currentUser } : null;
    },

    async getUsers(): Promise<User[]> {
      await simulateLatency();
      return _users.map(u => ({ ...u }));
    },

    async login(email: string, role: UserRole = 'Owner'): Promise<{ user: User; token: string }> {
      await simulateLatency();
      const existing = _users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        _currentUser = existing;
        return { user: { ...existing }, token: `mock-jwt-${existing.id}` };
      }

      const namePart = email.split('@')[0].replace('.', ' ');
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        initials: name.substring(0, 2).toUpperCase(),
        role,
        title: 'Team Contributor',
        joinedAt: new Date().toISOString(),
        twoFactorEnabled: false,
      };

      _users.push(newUser);
      _currentUser = newUser;
      return { user: { ...newUser }, token: `mock-jwt-${newUser.id}` };
    },

    async signup(
      name: string,
      email: string,
      orgName: string,
      timezone = 'Africa/Lagos'
    ): Promise<{ user: User; organization: Organization; token: string }> {
      await simulateLatency();
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        initials: name.substring(0, 2).toUpperCase(),
        role: 'Owner',
        title: 'Founder & Team Lead',
        joinedAt: new Date().toISOString(),
        twoFactorEnabled: false,
      };

      const newOrg: Organization = {
        id: `org-${Date.now()}`,
        name: orgName,
        slug: orgName.toLowerCase().replace(/\s+/g, '-'),
        plan: 'Growth',
        timezone,
        currentRole: 'Owner',
        membersCount: 1,
      };

      _users.push(newUser);
      _organizations.unshift(newOrg);

      const ownerMembership: Membership = {
        id: `mem-${Date.now()}`,
        orgId: newOrg.id,
        user: newUser,
        role: 'Owner',
        joinedDate: new Date().toISOString(),
        status: 'active',
      };
      _memberships.unshift(ownerMembership);
      _currentUser = newUser;

      return {
        user: { ...newUser },
        organization: { ...newOrg },
        token: `mock-jwt-${newUser.id}`,
      };
    },

    async logout(): Promise<void> {
      await simulateLatency();
      _currentUser = null;
    },
  },

  orgs: {
    async list(): Promise<Organization[]> {
      await simulateLatency();
      return _organizations.map(o => ({ ...o }));
    },

    async getById(id: string): Promise<Organization | null> {
      await simulateLatency();
      const found = _organizations.find(o => o.id === id);
      return found ? { ...found } : null;
    },

    async create(name: string, timezone = 'Africa/Lagos'): Promise<Organization> {
      await simulateLatency();
      const newOrg: Organization = {
        id: `org-${Date.now()}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        plan: 'Growth',
        timezone,
        currentRole: 'Owner',
        membersCount: 1,
      };
      _organizations.unshift(newOrg);
      return { ...newOrg };
    },

    async update(orgId: string, updates: Partial<Organization>): Promise<Organization> {
      await simulateLatency();
      const idx = _organizations.findIndex(o => o.id === orgId);
      if (idx === -1) {
        throw new Error(`Organization ${orgId} not found`);
      }
      const updated = { ..._organizations[idx], ...updates };
      _organizations[idx] = updated;
      return { ...updated };
    },

    async delete(orgId: string): Promise<{ success: boolean; orgId: string }> {
      await simulateLatency();
      _organizations = _organizations.filter(o => o.id !== orgId);
      _projects = _projects.filter(p => p.orgId !== orgId);
      _tasks = _tasks.filter(t => t.orgId !== orgId);
      _memberships = _memberships.filter(m => m.orgId !== orgId);
      _invitations = _invitations.filter(i => i.orgId !== orgId);
      return { success: true, orgId };
    },
  },

  projects: {
    async list(orgId: string): Promise<Project[]> {
      await simulateLatency();
      return _projects.filter(p => p.orgId === orgId).map(p => ({ ...p }));
    },

    async getById(orgId: string, projectId: string): Promise<Project | null> {
      await simulateLatency();
      const found = _projects.find(p => p.orgId === orgId && p.id === projectId);
      return found ? { ...found } : null;
    },

    async create(
      orgId: string,
      data: {
        name: string;
        key: string;
        description: string;
        color: string;
        leadId: string;
      }
    ): Promise<Project> {
      await simulateLatency();
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        orgId,
        name: data.name,
        key: data.key.toUpperCase(),
        description: data.description,
        color: data.color,
        leadId: data.leadId,
        status: 'active',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        memberIds: [data.leadId],
      };
      _projects.unshift(newProj);
      return { ...newProj };
    },

    async update(orgId: string, projectId: string, updates: Partial<Project>): Promise<Project> {
      await simulateLatency();
      const idx = _projects.findIndex(p => p.orgId === orgId && p.id === projectId);
      if (idx === -1) {
        throw new Error(`Project ${projectId} not found in org ${orgId}`);
      }
      const updated = { ..._projects[idx], ...updates };
      _projects[idx] = updated;
      return { ...updated };
    },

    async archive(orgId: string, projectId: string): Promise<Project> {
      await simulateLatency();
      const idx = _projects.findIndex(p => p.orgId === orgId && p.id === projectId);
      if (idx === -1) {
        throw new Error(`Project ${projectId} not found in org ${orgId}`);
      }
      _projects[idx].status = 'archived';
      return { ..._projects[idx] };
    },
  },

  tasks: {
    async list(orgId: string, filter?: { projectId?: string }): Promise<Task[]> {
      await simulateLatency();
      let result = _tasks.filter(t => t.orgId === orgId);
      if (filter?.projectId) {
        result = result.filter(t => t.projectId === filter.projectId);
      }
      return result.map(t => ({ ...t }));
    },

    async create(
      orgId: string,
      data: {
        projectId: string;
        title: string;
        description: string;
        status: TaskStatus;
        priority: TaskPriority;
        assigneeId?: string;
        createdById: string;
        dueDate?: string;
        tags?: string[];
      }
    ): Promise<Task> {
      await simulateLatency();
      const proj = _projects.find(p => p.orgId === orgId && p.id === data.projectId);
      const projKey = proj ? proj.key : 'TSK';
      const count = _tasks.filter(t => t.projectId === data.projectId).length + 101;

      const columnTasks = _tasks.filter(
        t => t.projectId === data.projectId && t.status === data.status
      );
      const position = columnTasks.length;

      const newTask: Task = {
        id: `task-${Date.now()}`,
        key: `${projKey}-${count}`,
        projectId: data.projectId,
        orgId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        createdById: data.createdById,
        position,
        dueDate: data.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: data.tags || ['General'],
        comments: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      _tasks.unshift(newTask);
      return { ...newTask };
    },

    async update(orgId: string, taskId: string, updates: Partial<Task>): Promise<Task> {
      await simulateLatency();
      const index = _tasks.findIndex(t => t.orgId === orgId && t.id === taskId);
      if (index === -1) {
        throw new Error(`Task ${taskId} not found in org ${orgId}`);
      }
      const updated: Task = {
        ..._tasks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      _tasks[index] = updated;
      return { ...updated };
    },

    async move(
      orgId: string,
      taskId: string,
      params: { status: TaskStatus; placement?: 'top' | 'bottom'; position?: number }
    ): Promise<Task[]> {
      await simulateLatency();
      const taskIndex = _tasks.findIndex(t => t.orgId === orgId && t.id === taskId);
      if (taskIndex === -1) {
        throw new Error(`Task ${taskId} not found in org ${orgId}`);
      }

      const taskToMove = { ..._tasks[taskIndex] };
      const oldStatus = taskToMove.status;
      const targetStatus = params.status;

      taskToMove.status = targetStatus;
      taskToMove.updatedAt = new Date().toISOString();

      const remainingTasks = _tasks.filter(t => t.id !== taskId);

      // Target column tasks in the same project
      const targetColTasks = remainingTasks
        .filter(t => t.projectId === taskToMove.projectId && t.status === targetStatus)
        .sort((a, b) => a.position - b.position);

      let targetPosition: number;
      if (params.placement === 'top') {
        targetPosition = 0;
      } else if (params.placement === 'bottom') {
        targetPosition = targetColTasks.length;
      } else if (params.position !== undefined) {
        targetPosition = Math.max(0, params.position);
      } else {
        targetPosition = targetColTasks.length;
      }

      const clampedPosition = Math.min(targetPosition, targetColTasks.length);
      targetColTasks.splice(clampedPosition, 0, taskToMove);

      targetColTasks.forEach((t, i) => {
        t.position = i;
      });

      if (oldStatus !== targetStatus) {
        const sourceColTasks = remainingTasks
          .filter(t => t.projectId === taskToMove.projectId && t.status === oldStatus)
          .sort((a, b) => a.position - b.position);

        sourceColTasks.forEach((t, i) => {
          t.position = i;
        });
      }

      const otherTasks = remainingTasks.filter(
        t => t.projectId !== taskToMove.projectId || (t.status !== targetStatus && t.status !== oldStatus)
      );

      _tasks = [...otherTasks, ...targetColTasks];
      return _tasks.filter(t => t.orgId === orgId).map(t => ({ ...t }));
    },

    async delete(orgId: string, taskId: string): Promise<{ success: boolean; taskId: string }> {
      await simulateLatency();
      _tasks = _tasks.filter(t => !(t.orgId === orgId && t.id === taskId));
      return { success: true, taskId };
    },
  },

  comments: {
    async list(orgId: string, taskId: string): Promise<Comment[]> {
      await simulateLatency();
      const task = _tasks.find(t => t.orgId === orgId && t.id === taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found in org ${orgId}`);
      }
      return task.comments.map(c => ({ ...c }));
    },

    async add(
      orgId: string,
      taskId: string,
      commentData: {
        authorId: string;
        authorName: string;
        authorAvatar?: string;
        authorInitials: string;
        content: string;
      }
    ): Promise<Comment> {
      await simulateLatency();
      const task = _tasks.find(t => t.orgId === orgId && t.id === taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found in org ${orgId}`);
      }

      const newComment: Comment = {
        id: `comm-${Date.now()}`,
        orgId,
        taskId,
        authorId: commentData.authorId,
        authorName: commentData.authorName,
        authorAvatar: commentData.authorAvatar,
        authorInitials: commentData.authorInitials,
        content: commentData.content,
        createdAt: new Date().toISOString(),
      };

      task.comments.push(newComment);
      return { ...newComment };
    },
  },

  attachments: {
    /**
     * Step 1 of two-step upload: Generates signed upload URL and fileKey.
     */
    async createUploadUrl(
      orgId: string,
      taskId: string,
      fileMeta: { name: string; size: string; type: string }
    ): Promise<UploadUrlResponse> {
      await simulateLatency();
      const task = _tasks.find(t => t.orgId === orgId && t.id === taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found in org ${orgId}`);
      }

      const fileKey = `attachments/${orgId}/${taskId}/${Date.now()}-${fileMeta.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      return {
        uploadUrl: `https://storage.taskflow.io/upload/${fileKey}?token=${Math.random().toString(36).substring(2, 10)}`,
        fileKey,
        expiresInSeconds: 900,
      };
    },

    /**
     * Step 2 of two-step upload: Confirms successful file transfer and commits attachment metadata.
     */
    async confirm(
      orgId: string,
      taskId: string,
      metadata: {
        fileKey: string;
        name: string;
        size: string;
        type: string;
        uploaderName: string;
      }
    ): Promise<Attachment> {
      await simulateLatency();
      const task = _tasks.find(t => t.orgId === orgId && t.id === taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found in org ${orgId}`);
      }

      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        orgId,
        taskId,
        name: metadata.name,
        size: metadata.size,
        type: metadata.type,
        uploadedAt: new Date().toISOString(),
        uploaderName: metadata.uploaderName,
        url: `https://storage.taskflow.io/${metadata.fileKey}`,
      };

      task.attachments.push(newAttachment);
      return { ...newAttachment };
    },

    async delete(
      orgId: string,
      taskId: string,
      attachmentId: string
    ): Promise<{ success: boolean; attachmentId: string }> {
      await simulateLatency();
      const task = _tasks.find(t => t.orgId === orgId && t.id === taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found in org ${orgId}`);
      }

      task.attachments = task.attachments.filter(a => a.id !== attachmentId);
      return { success: true, attachmentId };
    },
  },

  members: {
    async list(orgId: string): Promise<Membership[]> {
      await simulateLatency();
      return _memberships.filter(m => m.orgId === orgId).map(m => ({ ...m }));
    },

    async updateRole(orgId: string, memberId: string, role: UserRole): Promise<Membership> {
      await simulateLatency();
      const index = _memberships.findIndex(m => m.orgId === orgId && m.id === memberId);
      if (index === -1) {
        throw new Error(`Member ${memberId} not found in org ${orgId}`);
      }
      _memberships[index].role = role;
      _memberships[index].user.role = role;
      return { ..._memberships[index] };
    },

    async remove(orgId: string, memberId: string): Promise<{ success: boolean; memberId: string }> {
      await simulateLatency();
      _memberships = _memberships.filter(m => !(m.orgId === orgId && m.id === memberId));
      return { success: true, memberId };
    },
  },

  invitations: {
    async list(orgId: string): Promise<Invitation[]> {
      await simulateLatency();
      return _invitations.filter(i => i.orgId === orgId && !i.acceptedAt).map(i => ({ ...i }));
    },

    async create(
      orgId: string,
      data: { email: string; role: UserRole }
    ): Promise<Invitation> {
      await simulateLatency();

      const newInvitation: Invitation = {
        id: `inv-${Date.now()}`,
        orgId,
        email: data.email,
        role: data.role,
        token: `tok-${Math.random().toString(36).substring(2, 9)}`,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        acceptedAt: null,
      };

      _invitations.push(newInvitation);

      _notifications.unshift({
        id: `notif-${Date.now()}`,
        orgId,
        title: 'Invitation created',
        description: `Pending invite for ${data.email} as ${data.role}`,
        timestamp: 'Just now',
        read: false,
        type: 'team',
      });

      return { ...newInvitation };
    },

    async revoke(
      orgId: string,
      invitationId: string
    ): Promise<{ success: boolean; invitationId: string }> {
      await simulateLatency();
      _invitations = _invitations.filter(i => !(i.orgId === orgId && i.id === invitationId));
      return { success: true, invitationId };
    },

    /**
     * Demo action: accepts an invitation token and creates the Membership.
     */
    async accept(token: string): Promise<{ membership: Membership; user: User }> {
      await simulateLatency();
      const inv = _invitations.find(i => i.token === token && !i.acceptedAt);
      if (!inv) {
        throw new Error('Invalid or expired invitation token');
      }

      inv.acceptedAt = new Date().toISOString();

      const namePart = inv.email.split('@')[0].replace('.', ' ');
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      let user = _users.find(u => u.email.toLowerCase() === inv.email.toLowerCase());
      if (!user) {
        user = {
          id: `user-${Date.now()}`,
          name,
          email: inv.email,
          initials: name.substring(0, 2).toUpperCase(),
          role: inv.role,
          title: inv.role === 'Admin' ? 'Team Lead' : 'Contributor',
          joinedAt: new Date().toISOString(),
          twoFactorEnabled: false,
        };
        _users.push(user);
      }

      const membership: Membership = {
        id: `mem-${Date.now()}`,
        orgId: inv.orgId,
        user,
        role: inv.role,
        joinedDate: new Date().toISOString(),
        status: 'active',
      };
      _memberships.push(membership);

      const targetOrg = _organizations.find(o => o.id === inv.orgId);
      if (targetOrg) {
        targetOrg.membersCount += 1;
      }

      _notifications.unshift({
        id: `notif-${Date.now()}`,
        orgId: inv.orgId,
        title: 'Member joined',
        description: `${user.name} accepted their invitation as ${inv.role}`,
        timestamp: 'Just now',
        read: false,
        type: 'team',
      });

      return { membership: { ...membership }, user: { ...user } };
    },
  },

  notifications: {
    async list(orgId: string): Promise<NotificationItem[]> {
      await simulateLatency();
      return _notifications.filter(n => !n.orgId || n.orgId === orgId).map(n => ({ ...n }));
    },

    async markRead(orgId: string, id: string): Promise<NotificationItem> {
      await simulateLatency();
      const notif = _notifications.find(n => (!n.orgId || n.orgId === orgId) && n.id === id);
      if (notif) {
        notif.read = true;
        return { ...notif };
      }
      throw new Error(`Notification ${id} not found`);
    },

    async markAllRead(orgId: string): Promise<NotificationItem[]> {
      await simulateLatency();
      _notifications = _notifications.map(n => {
        if (!n.orgId || n.orgId === orgId) {
          return { ...n, read: true };
        }
        return n;
      });
      return _notifications.filter(n => !n.orgId || n.orgId === orgId).map(n => ({ ...n }));
    },
  },
};
