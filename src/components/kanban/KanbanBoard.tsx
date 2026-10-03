import React, { useState } from 'react';
import { useTaskFlow, useUsers } from '../../mock-data/store';
import { TaskPriority, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { KanbanSkeleton } from '../common/Skeletons';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Circle,
  X,
} from 'lucide-react';

interface KanbanBoardProps {
  projectId: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const {
    getTasksByProject,
    moveTask,
    setSelectedTask,
    createTask,
    isTasksLoading,
  } = useTaskFlow();

  const { users } = useUsers();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<TaskStatus | null>(null);
  const [targetDropIndex, setTargetDropIndex] = useState<{ status: TaskStatus; index: number } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Quick task creation state
  const [quickCreateColumn, setQuickCreateColumn] = useState<TaskStatus | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');

  const allProjectTasks = getTasksByProject(projectId);

  // Apply filters
  const filteredTasks = allProjectTasks.filter(task => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchKey = task.key.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      if (!matchTitle && !matchKey && !matchDesc) return false;
    }

    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }

    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' && task.assigneeId) return false;
      if (assigneeFilter !== 'unassigned' && task.assigneeId !== assigneeFilter) return false;
    }

    return true;
  });

  const columns: { id: TaskStatus; label: string; icon: React.ReactNode }[] = [
    {
      id: 'TODO',
      label: 'To Do',
      icon: <Circle className="w-3.5 h-3.5 text-zinc-400" />,
    },
    {
      id: 'IN_PROGRESS',
      label: 'In Progress',
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    },
    {
      id: 'DONE',
      label: 'Done',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    },
  ];

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOverColumn = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropZone !== status) {
      setActiveDropZone(status);
    }
  };

  const handleDragOverCard = (e: React.DragEvent, status: TaskStatus, cardIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;
    const computedIndex = isAfter ? cardIndex + 1 : cardIndex;
    setTargetDropIndex({ status, index: computedIndex });
    setActiveDropZone(status);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      const position = targetDropIndex?.status === status ? targetDropIndex.index : 999;
      moveTask(taskId, status, position);
    }
    setDraggedTaskId(null);
    setActiveDropZone(null);
    setTargetDropIndex(null);
  };

  const handleQuickCreateSubmit = async (e: React.FormEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await createTask({
      projectId,
      title: quickTitle.trim(),
      description: '',
      status,
      priority: quickPriority,
    });

    setQuickTitle('');
    setQuickCreateColumn(null);
  };

  if (isTasksLoading && allProjectTasks.length === 0) {
    return <KanbanSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Board Controls & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, ID, or description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Priority Filter & Assignee Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters:</span>
          </div>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {columns.map(column => {
          const colTasks = filteredTasks.filter(t => t.status === column.id);
          const isOverThisCol = activeDropZone === column.id;

          return (
            <div
              key={column.id}
              onDragOver={e => handleDragOverColumn(e, column.id)}
              onDragLeave={() => {}}
              onDrop={e => handleDrop(e, column.id)}
              className={`flex flex-col rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/40 border transition-all min-h-[460px] p-3 ${
                isOverThisCol
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20'
                  : 'border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/60 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {column.label}
                  </h3>
                  <span className="font-mono text-[11px] tabular-nums px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setQuickCreateColumn(quickCreateColumn === column.id ? null : column.id);
                    setQuickTitle('');
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                  title={`Add task to ${column.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Create Box */}
              {quickCreateColumn === column.id && (
                <form
                  onSubmit={e => handleQuickCreateSubmit(e, column.id)}
                  className="mb-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-400 dark:border-indigo-600 shadow-sm space-y-2 animate-in fade-in zoom-in-95 duration-150"
                >
                  <input
                    type="text"
                    placeholder="Task title..."
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                    className="w-full text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden"
                    autoFocus
                  />
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <select
                      value={quickPriority}
                      onChange={e => setQuickPriority(e.target.value as TaskPriority)}
                      className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickCreateColumn(null)}
                        className="px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-0.5 text-[11px] font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Task Cards List with Drag Reordering */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center p-4">
                    <p className="text-xs text-zinc-400">No tasks in {column.label}</p>
                    <button
                      onClick={() => setQuickCreateColumn(column.id)}
                      className="mt-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add one
                    </button>
                  </div>
                ) : (
                  colTasks.map((task, idx) => (
                    <React.Fragment key={task.id}>
                      {targetDropIndex?.status === column.id && targetDropIndex.index === idx && (
                        <div className="h-1 rounded bg-indigo-500 animate-pulse my-1" />
                      )}
                      <TaskCard
                        task={task}
                        index={idx}
                        onClick={() => setSelectedTask(task)}
                        onDragStart={handleDragStart}
                        onDragOverCard={e => handleDragOverCard(e, column.id, idx)}
                      />
                    </React.Fragment>
                  ))
                )}
                {targetDropIndex?.status === column.id && targetDropIndex.index >= colTasks.length && (
                  <div className="h-1 rounded bg-indigo-500 animate-pulse my-1" />
                )}
              </div>

              {/* Bottom Quick Add Affordance */}
              <button
                onClick={() => {
                  setQuickCreateColumn(column.id);
                  setQuickTitle('');
                }}
                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
