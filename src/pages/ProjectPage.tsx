import React, { useState } from 'react';
import { useTaskFlow, useUsers } from '../mock-data/store';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { CreateTaskModal } from '../components/projects/CreateTaskModal';
import { taskStatusToDisplay } from '../types';
import {
  Kanban,
  ListFilter,
  Plus,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Circle,
  Paperclip,
  MessageSquare,
} from 'lucide-react';

export const ProjectPage: React.FC = () => {
  const {
    projects,
    selectedProjectId,
    getTasksByProject,
    setSelectedTask,
    setIsNewProjectModalOpen,
  } = useTaskFlow();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const { getUserById } = useUsers();

  const project = projects.find(p => p.id === selectedProjectId) || projects[0];

  if (!project) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          No Project Selected
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Select a project from the sidebar or initialize a new one.
        </p>
        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
        >
          Create Project
        </button>
      </div>
    );
  }

  const projectTasks = getTasksByProject(project.id);
  const lead = getUserById(project.leadId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Project Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {project.name}
            </h1>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {project.key}
            </span>
          </div>

          <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View switcher tabs */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700">
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={() => setIsCreateTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Main View: Kanban or List */}
      {viewMode === 'board' ? (
        <KanbanBoard projectId={project.id} />
      ) : (
        /* List View */
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {projectTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      No tasks found in this project.
                    </td>
                  </tr>
                ) : (
                  projectTasks.map(t => {
                    const assignee = getUserById(t.assigneeId);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-zinc-400 shrink-0">{t.key}</span>
                            <span className="truncate max-w-sm">{t.title}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 capitalize">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {taskStatusToDisplay(t.status)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 capitalize">
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              {assignee.avatar ? (
                                <img
                                  src={assignee.avatar}
                                  alt={assignee.name}
                                  referrerPolicy="no-referrer"
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                                  {assignee.initials}
                                </div>
                              )}
                              <span className="truncate text-zinc-700 dark:text-zinc-300">
                                {assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-500">
                          {t.dueDate}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2.5 text-zinc-400">
                            {t.attachments.length > 0 && (
                              <span className="flex items-center gap-0.5 font-mono">
                                <Paperclip className="w-3 h-3" />
                                {t.attachments.length}
                              </span>
                            )}
                            {t.comments.length > 0 && (
                              <span className="flex items-center gap-0.5 font-mono">
                                <MessageSquare className="w-3 h-3" />
                                {t.comments.length}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectId={project.id}
      />
    </div>
  );
};
