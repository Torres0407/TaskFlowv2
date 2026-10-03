import React, { useState, useRef, useEffect } from 'react';
import { useTaskFlow, useUsers } from '../../mock-data/store';
import {
  assistant,
  AssistantMessage,
  ProposedAction,
  ProposedActionPayload,
  getRemainingMessages,
} from '../../services/assistant';
import { api } from '../../services/api';
import { taskStatusToDisplay } from '../../types';
import {
  Sparkles,
  X,
  Send,
  Square,
  RotateCcw,
  Check,
  Ban,
  AlertCircle,
  FolderKanban,
  ArrowRight,
  PlusCircle,
  FileEdit,
  MessageSquare,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export const AssistantPanel: React.FC = () => {
  const {
    currentOrg,
    selectedProjectId,
    projects,
    tasks,
    selectedTask,
    refreshData,
    currentUser,
  } = useTaskFlow();

  const { getUserById } = useUsers();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposedActions, setProposedActions] = useState<ProposedAction[]>([]);
  const [remainingQuota, setRemainingQuota] = useState(getRemainingMessages());
  const [executingActionIds, setExecutingActionIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentProject = projects.find(p => p.id === selectedProjectId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setRemainingQuota(getRemainingMessages());
    }
  }, [isOpen, messages, proposedActions]);

  const handleSend = async (userPrompt?: string) => {
    const textToSend = (userPrompt || inputValue).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    const newMessages: AssistantMessage[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    if (!userPrompt) setInputValue('');
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await assistant.send(
        currentOrg.id,
        newMessages,
        {
          currentProjectId: selectedProjectId || undefined,
          openTaskId: selectedTask?.id || undefined,
        }
      );

      setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);

      if (response.proposedActions && response.proposedActions.length > 0) {
        setProposedActions(prev => [...prev, ...response.proposedActions]);
      }

      setRemainingQuota(getRemainingMessages());
    } catch (err: any) {
      setError(err?.message || 'Assistant unavailable. Please try again.');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleClear = () => {
    setMessages([]);
    setProposedActions([]);
    setError(null);
  };

  // Execution of Approved Actions - Idempotent by action.id
  const handleApproveAction = async (action: ProposedAction) => {
    // Idempotent: ignore if already executing or already decided
    if (executingActionIds.has(action.id) || action.status !== 'pending') {
      return;
    }

    setExecutingActionIds(prev => new Set(prev).add(action.id));
    setError(null);

    try {
      const payload = action.payload;

      if (payload.type === 'create_task') {
        await api.tasks.create(currentOrg.id, {
          projectId: payload.projectId,
          title: payload.title,
          description: payload.description || '',
          status: payload.status || 'TODO',
          priority: payload.priority || 'medium',
          assigneeId: payload.assigneeId,
          createdById: currentUser?.id || 'user-1',
          dueDate: payload.dueDate,
        });
      } else if (payload.type === 'update_task') {
        await api.tasks.update(currentOrg.id, payload.taskId, payload.updates);
      } else if (payload.type === 'move_task') {
        await api.tasks.move(currentOrg.id, payload.taskId, {
          status: payload.status,
          placement: payload.placement || 'bottom',
        });
      } else if (payload.type === 'add_comment') {
        await api.comments.add(currentOrg.id, payload.taskId, {
          authorId: currentUser?.id || 'user-1',
          authorName: currentUser?.name || 'User',
          authorAvatar: currentUser?.avatar,
          authorInitials: currentUser?.initials || 'U',
          content: payload.content,
        });
      }

      // Mark approved
      setProposedActions(prev =>
        prev.map(a => (a.id === action.id ? { ...a, status: 'approved' } : a))
      );

      // Refresh data across the entire workspace
      await refreshData();
    } catch (err: any) {
      setError(`Failed to execute action: ${err?.message}`);
    } finally {
      setExecutingActionIds(prev => {
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }
  };

  const handleRejectAction = (actionId: string) => {
    if (executingActionIds.has(actionId)) return;
    setProposedActions(prev =>
      prev.map(a => (a.id === actionId ? { ...a, status: 'rejected' } : a))
    );
  };

  // Structured Payload Resolver: resolves IDs to entities in code (no reliance on model text)
  const resolveActionCard = (action: ProposedAction) => {
    const payload = action.payload;

    if (payload.type === 'create_task') {
      const targetProj = projects.find(p => p.id === payload.projectId);
      const assignee = payload.assigneeId ? getUserById(payload.assigneeId) : null;
      const isResolvable = Boolean(targetProj) && (!payload.assigneeId || Boolean(assignee));

      let resolutionError = '';
      if (!targetProj) {
        resolutionError = `Unknown Project ID "${payload.projectId || 'unspecified'}". Project cannot be resolved.`;
      } else if (payload.assigneeId && !assignee) {
        resolutionError = `Unknown Assignee ID "${payload.assigneeId}". Assignee cannot be resolved.`;
      }

      return {
        badge: 'CREATE TASK',
        icon: <PlusCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
        isResolvable,
        resolutionError,
        summary: `Create task in ${targetProj ? `${targetProj.name} (${targetProj.key})` : payload.projectId}`,
        fields: [
          { label: 'Title', value: payload.title },
          { label: 'Project', value: targetProj ? `${targetProj.name} (${targetProj.key})` : payload.projectId, invalid: !targetProj },
          { label: 'Status', value: payload.status || 'todo' },
          { label: 'Priority', value: payload.priority || 'medium' },
          payload.assigneeId ? { label: 'Assignee', value: assignee ? assignee.name : payload.assigneeId, invalid: !assignee } : null,
          payload.dueDate ? { label: 'Due Date', value: payload.dueDate } : null,
          payload.description ? { label: 'Description', value: payload.description } : null,
        ].filter(Boolean) as { label: string; value: string; invalid?: boolean }[],
      };
    }

    if (payload.type === 'update_task') {
      const task = tasks.find(t => t.id === payload.taskId);
      const newAssignee = payload.updates.assigneeId ? getUserById(payload.updates.assigneeId) : null;
      const oldAssignee = task?.assigneeId ? getUserById(task.assigneeId) : null;
      const isResolvable = Boolean(task) && (!payload.updates.assigneeId || Boolean(newAssignee));

      let resolutionError = '';
      if (!task) {
        resolutionError = `Task ID "${payload.taskId}" not found in current organization.`;
      } else if (payload.updates.assigneeId && !newAssignee) {
        resolutionError = `Unknown Assignee ID "${payload.updates.assigneeId}". Assignee cannot be resolved.`;
      }

      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

      const diffFields: { label: string; value: string; invalid?: boolean }[] = [
        { label: 'Target Task', value: task ? `${task.key}: ${task.title}` : payload.taskId, invalid: !task },
      ];

      if (payload.updates.title && task) {
        diffFields.push({
          label: 'Title',
          value: `"${task.title}" → "${payload.updates.title}"`,
        });
      }
      if (payload.updates.priority && task) {
        diffFields.push({
          label: 'Priority',
          value: `${capitalize(task.priority)} → ${capitalize(payload.updates.priority)}`,
        });
      }
      if (payload.updates.status && task) {
        diffFields.push({
          label: 'Status',
          value: `${taskStatusToDisplay(task.status)} → ${taskStatusToDisplay(payload.updates.status)}`,
        });
      }
      if (payload.updates.assigneeId !== undefined && task) {
        const oldName = oldAssignee ? oldAssignee.name : (task.assigneeId ? 'Unknown' : 'Unassigned');
        const newName = newAssignee ? newAssignee.name : (payload.updates.assigneeId ? payload.updates.assigneeId : 'Unassigned');
        diffFields.push({
          label: 'Assignee',
          value: `${oldName} → ${newName}`,
          invalid: Boolean(payload.updates.assigneeId && !newAssignee),
        });
      }
      if (payload.updates.dueDate && task) {
        diffFields.push({
          label: 'Due Date',
          value: `${task.dueDate} → ${payload.updates.dueDate}`,
        });
      }
      if (payload.updates.description !== undefined && task) {
        const truncate = (str: string, len = 25) => (str.length > len ? `${str.slice(0, len)}...` : str);
        const oldDesc = task.description ? `"${truncate(task.description)}"` : 'None';
        const newDesc = payload.updates.description ? `"${truncate(payload.updates.description)}"` : 'None';
        diffFields.push({
          label: 'Description',
          value: `${oldDesc} → ${newDesc}`,
        });
      }

      return {
        badge: 'UPDATE TASK',
        icon: <FileEdit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
        isResolvable,
        resolutionError,
        summary: task ? `Update ${task.key}: ${task.title}` : `Update task ${payload.taskId}`,
        fields: diffFields,
      };
    }

    if (payload.type === 'move_task') {
      const task = tasks.find(t => t.id === payload.taskId);
      const isResolvable = Boolean(task);
      const resolutionError = !task ? `Task ID "${payload.taskId}" not found in current organization.` : '';

      return {
        badge: 'MOVE TASK',
        icon: <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
        isResolvable,
        resolutionError,
        summary: task ? `Move ${task.key} to ${payload.status}` : `Move task ${payload.taskId}`,
        fields: [
          { label: 'Target Task', value: task ? `${task.key}: ${task.title}` : payload.taskId, invalid: !task },
          { label: 'Current Status', value: task?.status || 'unknown' },
          { label: 'Target Status', value: payload.status },
          { label: 'Placement', value: payload.placement === 'top' ? 'Top of column' : 'Bottom of column' },
        ],
      };
    }

    if (payload.type === 'add_comment') {
      const task = tasks.find(t => t.id === payload.taskId);
      const isResolvable = Boolean(task);
      const resolutionError = !task ? `Task ID "${payload.taskId}" not found in current organization.` : '';

      return {
        badge: 'ADD COMMENT',
        icon: <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
        isResolvable,
        resolutionError,
        summary: task ? `Comment on ${task.key}: ${task.title}` : `Comment on task ${payload.taskId}`,
        fields: [
          { label: 'Target Task', value: task ? `${task.key}: ${task.title}` : payload.taskId, invalid: !task },
          { label: 'Comment Content', value: payload.content },
        ],
      };
    }

    return {
      badge: 'ACTION',
      icon: <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />,
      isResolvable: false,
      resolutionError: 'Unsupported action payload',
      summary: 'Action',
      fields: [],
    };
  };

  const suggestedPrompts = [
    "What's overdue?",
    "Summarize this project",
    "List team members and roles",
    "Create tasks from these notes",
  ];

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const text = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed my-0.5">
            {formatInline(text)}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs leading-relaxed my-0.5">
          {formatInline(line)}
        </p>
      );
    });
  };

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Action Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all group"
          title="Open TaskFlow AI Assistant"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide">Ask Assistant</span>
        </button>
      )}

      {/* Slide-over Backdrop (Mobile only) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-xs sm:hidden"
        />
      )}

      {/* Assistant Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-50 w-full sm:w-[420px] h-[85vh] sm:h-[580px] max-h-[90vh] bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    TaskFlow AI
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Gemini
                  </span>
                </div>

                {/* Scoped Context Chip */}
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5 truncate">
                  <span className="truncate">{currentOrg.name}</span>
                  {currentProject && (
                    <>
                      <span>·</span>
                      <span className="font-semibold text-zinc-600 dark:text-zinc-300 truncate">
                        {currentProject.key}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  How can I help you today?
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  I can analyze overdue work, draft tasks, summarize projects, and help optimize delivery for {currentOrg.name}.
                </p>

                {/* Suggested Prompt Chips */}
                <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-medium transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60'
                    }`}
                  >
                    {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
                  </div>
                </div>
              ))
            )}

            {/* In-Flight Typing / Analysis Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <div className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <span>Analyzing workspace data...</span>
                <button
                  onClick={handleStop}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            )}

            {/* Error Message Card with Retry */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>Assistant Unavailable</span>
                </div>
                <p className="text-[11px] leading-relaxed">{error}</p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleSend(messages[messages.length - 1]?.content || 'Hello')}
                    className="px-2.5 py-1 rounded bg-red-600 text-white font-medium text-[11px] hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Structured Confirmation Cards for Proposed Actions */}
            {proposedActions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <span>Proposed Actions ({proposedActions.length})</span>
                </div>

                {proposedActions.map(action => {
                  const card = resolveActionCard(action);
                  const isExecuting = executingActionIds.has(action.id);

                  return (
                    <div
                      key={action.id}
                      className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-2"
                    >
                      {/* Top Header: Badge & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {card.icon}
                          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
                            {card.badge}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                            action.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : action.status === 'rejected'
                              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {action.status}
                        </span>
                      </div>

                      {/* Code-Derived Summary (not model description) */}
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {card.summary}
                      </p>

                      {/* Structured Details Grid */}
                      <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 text-[11px] space-y-1">
                        {card.fields.map((f, i) => (
                          <div key={i} className="flex items-start justify-between gap-2">
                            <span className="text-zinc-500 shrink-0">{f.label}:</span>
                            <span
                              className={`text-right font-medium truncate max-w-[240px] ${
                                f.invalid
                                  ? 'text-red-600 dark:text-red-400 font-mono'
                                  : 'text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              {f.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Resolution Error if ID cannot be resolved */}
                      {!card.isResolvable && (
                        <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{card.resolutionError}</span>
                        </div>
                      )}

                      {/* Action Approval Controls */}
                      {action.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            disabled={isExecuting}
                            onClick={() => handleRejectAction(action.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[11px] font-medium transition-colors disabled:opacity-40"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Reject</span>
                          </button>

                          <button
                            disabled={!card.isResolvable || isExecuting}
                            onClick={() => handleApproveAction(action)}
                            title={
                              !card.isResolvable
                                ? 'Cannot approve: Entity IDs could not be resolved in the workspace'
                                : 'Approve and execute change'
                            }
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold transition-colors shadow-xs"
                          >
                            {isExecuting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>{isExecuting ? 'Applying...' : 'Approve & Apply'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Ask assistant or propose an action..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 font-mono">
              <span>Scoped to {currentOrg.name}</span>
              <span>{remainingQuota} messages left this hour</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
