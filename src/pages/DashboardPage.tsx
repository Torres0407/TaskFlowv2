import React, { useState } from 'react';
import { useTaskFlow, useUsers } from '../mock-data/store';
import { DashboardSkeleton } from '../components/common/Skeletons';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  TrendingUp,
  Search,
  Calendar,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    currentOrg,
    projects,
    tasks,
    setSelectedProjectId,
    setCurrentPage,
    setSelectedTask,
    setIsNewProjectModalOpen,
    isInitialLoading,
  } = useTaskFlow();

  const { getUserById } = useUsers();
  const [searchFilter, setSearchFilter] = useState('');

  if (isInitialLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <DashboardSkeleton />
      </div>
    );
  }

  // Filter projects by current org
  const orgProjects = projects.filter(p => p.orgId === currentOrg.id);
  const orgTasks = tasks.filter(t => t.orgId === currentOrg.id);

  // Stats calculations
  const openTasks = orgTasks.filter(t => t.status !== 'DONE');
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = orgTasks.filter(t => t.status !== 'DONE' && t.dueDate < today);
  const completedTasks = orgTasks.filter(t => t.status === 'DONE');

  // Filter projects by search
  const filteredProjects = orgProjects.filter(p => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.key.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  const handleOpenProject = (projId: string) => {
    setSelectedProjectId(projId);
    setCurrentPage('project');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {currentOrg.name} Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time project momentum, active sprints, and deliverable tracking.
          </p>
        </div>

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Summary Stats Grid - 2 rows x 2 columns on mobile, 4 columns on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Open Tasks */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-zinc-500 truncate">Open Tasks</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              {openTasks.length}
            </span>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
              All active projects
            </p>
          </div>
        </div>

        {/* Overdue */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-zinc-500 truncate">Overdue</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
              {overdueTasks.length}
            </span>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
              Needs attention
            </p>
          </div>
        </div>

        {/* Completed This Week */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-zinc-500 truncate">Completed</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              {completedTasks.length}
            </span>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span className="truncate">This week</span>
            </p>
          </div>
        </div>

        {/* Active Projects */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-zinc-500 truncate">Workspaces</span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
              <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
              {orgProjects.length}
            </span>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-0.5 sm:mt-1 truncate">
              Tier: {currentOrg.plan}
            </p>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Projects & Workspaces
            </h2>
            <span className="text-xs font-mono tabular-nums text-zinc-400">
              ({filteredProjects.length})
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Filter projects..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const todoCount = projectTasks.filter(t => t.status === 'TODO').length;
            const inProgressCount = projectTasks.filter(t => t.status === 'IN_PROGRESS').length;
            const doneCount = projectTasks.filter(t => t.status === 'DONE').length;
            const total = projectTasks.length;
            const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
            const lead = getUserById(project.leadId);

            return (
              <div
                key={project.id}
                onClick={() => handleOpenProject(project.id)}
                className="group relative p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top: Key & Color Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {project.key}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {project.dueDate}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1.5">
                    {project.name}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div>
                  {/* Progress Bar & Breakdown */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 font-medium">Completion</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%`, backgroundColor: project.color }}
                      />
                    </div>

                    {/* Breakdown counts */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
                      <span>{todoCount} to do</span>
                      <span>{inProgressCount} in progress</span>
                      <span>{doneCount} done</span>
                    </div>
                  </div>

                  {/* Footer: Lead avatar & CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      {lead?.avatar ? (
                        <img
                          src={lead.avatar}
                          alt={lead.name}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-semibold">
                          {lead?.initials || 'L'}
                        </div>
                      )}
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">
                        {lead?.name || 'Unassigned'}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open Board
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Urgent & Attention Queue */}
      {overdueTasks.length > 0 && (
        <div className="p-5 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <h3 className="text-xs font-semibold text-red-900 dark:text-red-300 uppercase tracking-wider">
              Immediate Action Required ({overdueTasks.length} Overdue)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueTasks.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-red-200/80 dark:border-red-900/60 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-semibold text-zinc-500">
                    {t.key}
                  </span>
                  <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-semibold">
                    Due: {t.dueDate}
                  </span>
                </div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                  {t.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
