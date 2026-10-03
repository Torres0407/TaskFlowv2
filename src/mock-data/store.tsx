import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Organization,
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  NotificationItem,
  Membership,
  Invitation,
  UserRole,
} from '../types';
import { api, SIMULATE_ERRORS, setSimulateErrors } from '../services/api';

interface TaskFlowContextType {
  // Auth & Users
  currentUser: User | null;
  users: User[];
  getUserById: (id?: string) => User | undefined;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  signup: (name: string, email: string, orgName: string, timezone?: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Navigation
  currentPage: 'dashboard' | 'project' | 'team-settings' | 'auth';
  setCurrentPage: (page: 'dashboard' | 'project' | 'team-settings' | 'auth') => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;

  // Organizations
  currentOrg: Organization;
  organizations: Organization[];
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (name: string, timezone?: string) => Promise<Organization>;
  updateOrganization: (updates: Partial<Organization>) => Promise<Organization>;
  deleteOrganization: (orgId: string) => Promise<void>;

  // Projects
  projects: Project[];
  createProject: (data: { name: string; key: string; description: string; color: string; leadId: string }) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<Project>;
  archiveProject: (projectId: string) => Promise<Project>;

  // Tasks
  tasks: Task[];
  getTasksByProject: (projectId: string) => Task[];
  moveTask: (taskId: string, newStatus: TaskStatus, targetPosition?: number) => Promise<boolean>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>;
  createTask: (data: {
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
    tags?: string[];
  }) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  addAttachment: (taskId: string, file: { name: string; size: string; type: string }) => Promise<void>;
  deleteAttachment: (taskId: string, attachmentId: string) => Promise<void>;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Memberships & Invitations
  memberships: Membership[];
  invitations: Invitation[];
  inviteMember: (email: string, role: UserRole) => Promise<Invitation>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: UserRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // Loading & Error States
  isLoading: boolean;
  isInitialLoading: boolean;
  isTasksLoading: boolean;
  error: string | null;
  clearError: () => void;
  refreshData: () => Promise<void>;

  // Simulation Controls for Testing
  simulateErrors: boolean;
  toggleSimulateErrors: () => void;

  // Modals
  isInviteModalOpen: boolean;
  setIsInviteModalOpen: (open: boolean) => void;
  isNewProjectModalOpen: boolean;
  setIsNewProjectModalOpen: (open: boolean) => void;
}

const TaskFlowContext = createContext<TaskFlowContextType | undefined>(undefined);

export const TaskFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskflow_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('taskflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  // Data States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization>({
    id: 'org-1',
    name: 'Acme Technologies',
    slug: 'acme-tech',
    plan: 'Enterprise',
    timezone: 'Africa/Lagos',
    currentRole: 'Owner',
    membersCount: 6,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Navigation State
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'project' | 'team-settings' | 'auth'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Loading & Error States
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulateErrors, setSimulateErrorsState] = useState(SIMULATE_ERRORS);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const toggleSimulateErrors = () => {
    const nextVal = !simulateErrors;
    setSimulateErrorsState(nextVal);
    setSimulateErrors(nextVal);
  };

  const clearError = () => setError(null);

  // Refresh data for the current active organization
  const refreshData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const orgId = currentOrg.id || 'org-1';

      const [loadedUsers, loadedOrgs, loadedProjects, loadedTasks, loadedMembers, loadedInvs, loadedNotifs, currentU] =
        await Promise.all([
          api.auth.getUsers(),
          api.orgs.list(),
          api.projects.list(orgId),
          api.tasks.list(orgId),
          api.members.list(orgId),
          api.invitations.list(orgId),
          api.notifications.list(orgId),
          api.auth.getCurrentUser(),
        ]);

      setUsers(loadedUsers);
      setOrganizations(loadedOrgs);
      if (loadedOrgs.length > 0) {
        const found = loadedOrgs.find(o => o.id === orgId);
        if (found) setCurrentOrg(found);
      }
      setProjects(loadedProjects);
      if (!selectedProjectId && loadedProjects.length > 0) {
        setSelectedProjectId(loadedProjects[0].id);
      }
      setTasks(loadedTasks);
      setMemberships(loadedMembers);
      setInvitations(loadedInvs);
      setNotifications(loadedNotifs);
      setCurrentUser(currentU);
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize workspace data.');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [currentOrg.id, selectedProjectId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getUserById = useCallback(
    (id?: string) => {
      if (!id) return undefined;
      return users.find(u => u.id === id);
    },
    [users]
  );

  // Auth Handlers
  const login = async (email: string, role: UserRole = 'Owner'): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.auth.login(email, role);
      setCurrentUser(res.user);
      const updatedUsers = await api.auth.getUsers();
      setUsers(updatedUsers);
      setCurrentPage('dashboard');
      return true;
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, orgName: string, timezone = 'Africa/Lagos'): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.auth.signup(name, email, orgName, timezone);
      setCurrentUser(res.user);
      setCurrentOrg(res.organization);
      setOrganizations(prev => [res.organization, ...prev]);

      const [updatedUsers, updatedMembers] = await Promise.all([
        api.auth.getUsers(),
        api.members.list(res.organization.id),
      ]);
      setUsers(updatedUsers);
      setMemberships(updatedMembers);
      setCurrentPage('dashboard');
      return true;
    } catch (err: any) {
      setError(err?.message || 'Account registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await api.auth.logout();
      setCurrentUser(null);
      setCurrentPage('auth');
    } catch (err: any) {
      setError(err?.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Organization Operations
  const switchOrganization = async (orgId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const targetOrg = organizations.find(o => o.id === orgId);
      if (targetOrg) {
        setCurrentOrg(targetOrg);
        const [orgProjects, orgTasks, orgMembers, orgInvs, orgNotifs] = await Promise.all([
          api.projects.list(orgId),
          api.tasks.list(orgId),
          api.members.list(orgId),
          api.invitations.list(orgId),
          api.notifications.list(orgId),
        ]);

        setProjects(orgProjects);
        setTasks(orgTasks);
        setMemberships(orgMembers);
        setInvitations(orgInvs);
        setNotifications(orgNotifs);

        if (orgProjects.length > 0) {
          setSelectedProjectId(orgProjects[0].id);
        } else {
          setSelectedProjectId(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganization = async (name: string, timezone = 'Africa/Lagos'): Promise<Organization> => {
    try {
      setIsLoading(true);
      setError(null);
      const newOrg = await api.orgs.create(name, timezone);
      setOrganizations(prev => [newOrg, ...prev]);
      setCurrentOrg(newOrg);
      return newOrg;
    } catch (err: any) {
      setError(err?.message || 'Failed to create organization');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrganization = async (updates: Partial<Organization>): Promise<Organization> => {
    try {
      setIsLoading(true);
      setError(null);
      const updated = await api.orgs.update(currentOrg.id, updates);
      setCurrentOrg(updated);
      setOrganizations(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Failed to update organization');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOrganization = async (orgId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await api.orgs.delete(orgId);
      setOrganizations(prev => prev.filter(o => o.id !== orgId));
      if (currentOrg.id === orgId && organizations.length > 1) {
        const next = organizations.find(o => o.id !== orgId)!;
        await switchOrganization(next.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete organization');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Project Operations
  const createProject = async (data: {
    name: string;
    key: string;
    description: string;
    color: string;
    leadId: string;
  }): Promise<Project> => {
    try {
      setIsLoading(true);
      setError(null);
      const newProj = await api.projects.create(currentOrg.id, data);
      setProjects(prev => [newProj, ...prev]);
      setSelectedProjectId(newProj.id);
      return newProj;
    } catch (err: any) {
      setError(err?.message || 'Failed to create project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<Project> => {
    try {
      setError(null);
      const updated = await api.projects.update(currentOrg.id, projectId, updates);
      setProjects(prev => prev.map(p => (p.id === projectId ? updated : p)));
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Failed to update project');
      throw err;
    }
  };

  const archiveProject = async (projectId: string): Promise<Project> => {
    try {
      setError(null);
      const updated = await api.projects.archive(currentOrg.id, projectId);
      setProjects(prev => prev.map(p => (p.id === projectId ? updated : p)));
      return updated;
    } catch (err: any) {
      setError(err?.message || 'Failed to archive project');
      throw err;
    }
  };

  // Task Operations
  const getTasksByProject = useCallback(
    (projectId: string) => {
      return tasks
        .filter(t => t.projectId === projectId)
        .sort((a, b) => a.position - b.position);
    },
    [tasks]
  );

  const moveTask = async (
    taskId: string,
    newStatus: TaskStatus,
    targetPosition?: number
  ): Promise<boolean> => {
    const previousTasks = [...tasks];
    const previousSelectedTask = selectedTask ? { ...selectedTask } : null;

    const movingTask = tasks.find(t => t.id === taskId);
    if (!movingTask) return false;

    const colTasks = tasks
      .filter(t => t.projectId === movingTask.projectId && t.status === newStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    const pos = targetPosition !== undefined ? targetPosition : colTasks.length;

    const updatedMoving = { ...movingTask, status: newStatus, position: pos };
    colTasks.splice(pos, 0, updatedMoving);
    colTasks.forEach((t, i) => {
      t.position = i;
    });

    const otherTasks = tasks.filter(
      t => t.projectId !== movingTask.projectId || (t.status !== newStatus && t.status !== movingTask.status)
    );

    let updatedOldColTasks: Task[] = [];
    if (movingTask.status !== newStatus) {
      updatedOldColTasks = tasks
        .filter(t => t.projectId === movingTask.projectId && t.status === movingTask.status && t.id !== taskId)
        .sort((a, b) => a.position - b.position);
      updatedOldColTasks.forEach((t, i) => {
        t.position = i;
      });
    }

    setTasks([...otherTasks, ...colTasks, ...updatedOldColTasks]);
    if (selectedTask?.id === taskId) {
      setSelectedTask(updatedMoving);
    }

    try {
      const serverTasks = await api.tasks.move(currentOrg.id, taskId, {
        status: newStatus,
        position: pos,
      });
      setTasks(serverTasks);
      return true;
    } catch (err: any) {
      setTasks(previousTasks);
      setSelectedTask(previousSelectedTask);
      setError(err?.message || 'Failed to move task. Reverted change.');
      return false;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const prevTasks = [...tasks];
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...updates } : t)));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => (prev ? { ...prev, ...updates } : null));
    }

    try {
      const updated = await api.tasks.update(currentOrg.id, taskId, updates);
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) setSelectedTask(updated);
      return updated;
    } catch (err: any) {
      setTasks(prevTasks);
      if (selectedTask?.id === taskId) {
        setSelectedTask(prevTasks.find(t => t.id === taskId) || null);
      }
      setError(err?.message || 'Failed to update task.');
      throw err;
    }
  };

  const createTask = async (data: {
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
    tags?: string[];
  }): Promise<Task> => {
    try {
      setIsTasksLoading(true);
      setError(null);
      const newTask = await api.tasks.create(currentOrg.id, {
        ...data,
        createdById: currentUser?.id || 'user-1',
      });
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err: any) {
      setError(err?.message || 'Failed to create task.');
      throw err;
    } finally {
      setIsTasksLoading(false);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    const prevTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);

    try {
      await api.tasks.delete(currentOrg.id, taskId);
    } catch (err: any) {
      setTasks(prevTasks);
      setError(err?.message || 'Failed to delete task.');
      throw err;
    }
  };

  const addComment = async (taskId: string, content: string): Promise<void> => {
    if (!currentUser || !content.trim()) return;

    try {
      const newComment = await api.comments.add(currentOrg.id, taskId, {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        authorInitials: currentUser.initials,
        content: content.trim(),
      });

      setTasks(prev =>
        prev.map(t => {
          if (t.id === taskId) {
            const updated = { ...t, comments: [...t.comments, newComment] };
            if (selectedTask?.id === taskId) setSelectedTask(updated);
            return updated;
          }
          return t;
        })
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to post comment.');
    }
  };

  // Two-step attachment upload: createUploadUrl -> confirm
  const addAttachment = async (
    taskId: string,
    file: { name: string; size: string; type: string }
  ): Promise<void> => {
    try {
      // Step 1: Request signed upload url & fileKey
      const uploadDetails = await api.attachments.createUploadUrl(currentOrg.id, taskId, file);

      // Step 2: Confirm upload completion
      const newAttachment = await api.attachments.confirm(currentOrg.id, taskId, {
        fileKey: uploadDetails.fileKey,
        name: file.name,
        size: file.size,
        type: file.type,
        uploaderName: currentUser?.name || 'Current User',
      });

      setTasks(prev =>
        prev.map(t => {
          if (t.id === taskId) {
            const updated = { ...t, attachments: [...t.attachments, newAttachment] };
            if (selectedTask?.id === taskId) setSelectedTask(updated);
            return updated;
          }
          return t;
        })
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to upload attachment.');
    }
  };

  const deleteAttachment = async (taskId: string, attachmentId: string): Promise<void> => {
    try {
      await api.attachments.delete(currentOrg.id, taskId, attachmentId);
      setTasks(prev =>
        prev.map(t => {
          if (t.id === taskId) {
            const updated = {
              ...t,
              attachments: t.attachments.filter(a => a.id !== attachmentId),
            };
            if (selectedTask?.id === taskId) setSelectedTask(updated);
            return updated;
          }
          return t;
        })
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to delete attachment.');
    }
  };

  // Notifications
  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = async (id: string): Promise<void> => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.notifications.markRead(currentOrg.id, id);
    } catch (err: any) {
      // silent catch for notifications
    }
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.notifications.markAllRead(currentOrg.id);
    } catch (err: any) {
      // silent catch
    }
  };

  // Memberships & Invitations
  const inviteMember = async (email: string, role: UserRole): Promise<Invitation> => {
    try {
      setIsLoading(true);
      setError(null);
      // Creates a pending Invitation (does not add Membership directly)
      const invitation = await api.invitations.create(currentOrg.id, {
        email,
        role,
      });

      setInvitations(prev => [invitation, ...prev]);

      const updatedNotifs = await api.notifications.list(currentOrg.id);
      setNotifications(updatedNotifs);

      return invitation;
    } catch (err: any) {
      setError(err?.message || 'Failed to create invitation.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeInvitation = async (invitationId: string): Promise<void> => {
    try {
      setError(null);
      await api.invitations.revoke(currentOrg.id, invitationId);
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke invitation.');
    }
  };

  // Demo action that accepts an invitation token and creates the active Membership
  const acceptInvitation = async (token: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.invitations.accept(token);

      setInvitations(prev => prev.filter(i => i.token !== token));
      setMemberships(prev => [...prev, res.membership]);
      setUsers(prev => {
        if (!prev.some(u => u.id === res.user.id)) {
          return [...prev, res.user];
        }
        return prev;
      });

      setOrganizations(prev =>
        prev.map(o => (o.id === currentOrg.id ? { ...o, membersCount: o.membersCount + 1 } : o))
      );

      const updatedNotifs = await api.notifications.list(currentOrg.id);
      setNotifications(updatedNotifs);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: UserRole): Promise<void> => {
    try {
      setError(null);
      const updated = await api.members.updateRole(currentOrg.id, memberId, role);
      setMemberships(prev => prev.map(m => (m.id === memberId ? updated : m)));
    } catch (err: any) {
      setError(err?.message || 'Failed to update member role.');
    }
  };

  const removeMember = async (memberId: string): Promise<void> => {
    try {
      setError(null);
      await api.members.remove(currentOrg.id, memberId);
      setMemberships(prev => prev.filter(m => m.id !== memberId));
      setOrganizations(prev =>
        prev.map(o => (o.id === currentOrg.id ? { ...o, membersCount: Math.max(1, o.membersCount - 1) } : o))
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to remove member.');
    }
  };

  return (
    <TaskFlowContext.Provider
      value={{
        currentUser,
        users,
        getUserById,
        login,
        signup,
        logout,
        theme,
        toggleTheme,
        currentPage,
        setCurrentPage,
        selectedProjectId,
        setSelectedProjectId,
        selectedTask,
        setSelectedTask,
        currentOrg,
        organizations,
        switchOrganization,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        projects,
        createProject,
        updateProject,
        archiveProject,
        tasks,
        getTasksByProject,
        moveTask,
        updateTask,
        createTask,
        deleteTask,
        addComment,
        addAttachment,
        deleteAttachment,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        memberships,
        invitations,
        inviteMember,
        revokeInvitation,
        acceptInvitation,
        updateMemberRole,
        removeMember,
        isLoading,
        isInitialLoading,
        isTasksLoading,
        error,
        clearError,
        refreshData,
        simulateErrors,
        toggleSimulateErrors,
        isInviteModalOpen,
        setIsInviteModalOpen,
        isNewProjectModalOpen,
        setIsNewProjectModalOpen,
      }}
    >
      {children}
    </TaskFlowContext.Provider>
  );
};

export const useTaskFlow = () => {
  const context = useContext(TaskFlowContext);
  if (!context) {
    throw new Error('useTaskFlow must be used within a TaskFlowProvider');
  }
  return context;
};

export const useUsers = () => {
  const { users, getUserById } = useTaskFlow();
  return { users, getUserById };
};
