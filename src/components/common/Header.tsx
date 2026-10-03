import React, { useState, useRef, useEffect } from 'react';
import { useTaskFlow, useUsers } from '../../mock-data/store';
import { NotificationsDropdown } from './NotificationsDropdown';
import { Task } from '../../types';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Plus,
  Search,
  ChevronRight,
  X,
  CheckCircle2,
  Clock,
  Circle,
  Command,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenCreateTask?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenCreateTask }) => {
  const {
    currentOrg,
    currentPage,
    projects,
    tasks,
    selectedProjectId,
    setSelectedProjectId,
    setSelectedTask,
    theme,
    toggleTheme,
    unreadNotificationCount,
    currentUser,
    setCurrentPage,
  } = useTaskFlow();

  const { getUserById } = useUsers();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const currentProject = projects.find(p => p.id === selectedProjectId);

  const getBreadcrumbTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Overview';
      case 'project':
        return currentProject?.name || 'Project Board';
      case 'team-settings':
        return 'Team & Roles';
      default:
        return 'Overview';
    }
  };

  // Keyboard shortcut Cmd+K or Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter tasks across all projects by title or assignee
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? tasks.filter(task => {
        const assignee = getUserById(task.assigneeId);
        const matchTitle = task.title.toLowerCase().includes(trimmedQuery);
        const matchKey = task.key.toLowerCase().includes(trimmedQuery);
        const matchAssignee = assignee
          ? assignee.name.toLowerCase().includes(trimmedQuery) ||
            assignee.email.toLowerCase().includes(trimmedQuery)
          : 'unassigned'.includes(trimmedQuery);

        return matchTitle || matchKey || matchAssignee;
      })
    : [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleSelectTask = (task: Task) => {
    setSelectedProjectId(task.projectId);
    setCurrentPage('project');
    setSelectedTask(task);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const handleKeyDownInSearch = (e: React.KeyboardEvent) => {
    if (!searchResults.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectTask(searchResults[selectedIndex]);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DONE':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'IN_PROGRESS':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'TODO':
      default:
        return <Circle className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50';
      case 'high':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50';
      case 'medium':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50';
      case 'low':
      default:
        return 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 gap-3">
      {/* Zone 1: Mobile Toggle & Contextual Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 -ml-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 md:hidden rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 min-w-0">
          <span className="font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[100px] sm:max-w-none">
            {currentOrg.name}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {getBreadcrumbTitle()}
          </span>
          {currentPage === 'project' && currentProject && (
            <span className="hidden lg:inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {currentProject.key}
            </span>
          )}
        </nav>
      </div>

      {/* Zone 2: Global Search Bar across all projects */}
      <div className="relative flex-1 max-w-xs sm:max-w-md mx-auto" ref={searchContainerRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleKeyDownInSearch}
            placeholder="Search tasks by title or assignee..."
            className="w-full pl-9 pr-14 py-1.5 text-xs rounded-xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all"
          />

          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-0.5 absolute right-2.5 text-[10px] text-zinc-400 font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 pointer-events-none">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800 text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Tasks matching "{searchQuery}"
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                {searchResults.length} {searchResults.length === 1 ? 'task' : 'tasks'} found
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 p-1">
              {searchResults.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-zinc-500 font-medium">
                    No tasks found matching "{searchQuery}"
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Try searching by task title, key (e.g. CLD-101), or assignee name (e.g. Alex, Elena, Marcus).
                  </p>
                </div>
              ) : (
                searchResults.map((task, index) => {
                  const assignee = getUserById(task.assigneeId);
                  const project = projects.find(p => p.id === task.projectId);
                  const isSelected = index === selectedIndex;

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleSelectTask(task)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {getStatusIcon(task.status)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[11px] font-semibold text-zinc-500">
                              {task.key}
                            </span>

                            {project && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 truncate">
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {task.title}
                          </p>

                          {/* Assignee label */}
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500">
                            {assignee ? (
                              <div className="flex items-center gap-1.5">
                                {assignee.avatar ? (
                                  <img
                                    src={assignee.avatar}
                                    alt={assignee.name}
                                    className="w-3.5 h-3.5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold">
                                    {assignee.initials}
                                  </div>
                                )}
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                  {assignee.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic">Unassigned</span>
                            )}
                            <span>·</span>
                            <span>Due {task.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border shrink-0 ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-[11px] text-zinc-400 px-3">
              <span>Use ↑ ↓ to navigate, Enter to open</span>
              <span>ESC to dismiss</span>
            </div>
          </div>
        )}
      </div>

      {/* Zone 3: Actions (New Task button, Notifications, Theme, Profile) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {currentPage === 'project' && onOpenCreateTask && (
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add Task</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Open notifications"
            className="relative p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-zinc-950" />
            )}
          </button>
          <NotificationsDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>

        {/* Profile Avatar / Quick switch */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-1 rounded-full focus:outline-hidden ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950 focus:ring-2 focus:ring-indigo-500"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                {currentUser?.initials || 'U'}
              </div>
            )}
          </button>

          {isUserMenuOpen && (
            <div
              onMouseLeave={() => setIsUserMenuOpen(false)}
              className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 z-50 text-xs animate-in fade-in duration-100"
            >
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-zinc-500 truncate">{currentUser?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  Role: {currentUser?.role}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setCurrentPage('team-settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Organization Settings
                </button>
              </div>

              <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => {
                    setCurrentPage('auth');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
