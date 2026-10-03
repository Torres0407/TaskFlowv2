import React, { useState, useRef, useEffect } from 'react';
import { useTaskFlow } from '../../mock-data/store';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Plus,
  Check,
  ChevronDown,
  Building2,
  UserPlus,
  LogOut,
  FolderPlus,
  Layers,
  Moon,
  Sun,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    currentOrg,
    organizations,
    switchOrganization,
    createOrganization,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    currentPage,
    setCurrentPage,
    currentUser,
    logout,
    theme,
    toggleTheme,
    setIsInviteModalOpen,
    setIsNewProjectModalOpen,
  } = useTaskFlow();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgTimezone, setNewOrgTimezone] = useState('Africa/Lagos');
  const orgDropdownRef = useRef<HTMLDivElement>(null);

  // Close org dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target as Node)) {
        setIsOrgDropdownOpen(false);
        setIsCreatingOrg(false);
      }
    };
    if (isOrgDropdownOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOrgDropdownOpen]);

  const currentOrgProjects = projects.filter(p => p.orgId === currentOrg.id);

  const handleCreateOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrgName.trim()) {
      createOrganization(newOrgName.trim(), newOrgTimezone);
      setNewOrgName('');
      setIsCreatingOrg(false);
      setIsOrgDropdownOpen(false);
    }
  };

  const navTo = (page: 'dashboard' | 'project' | 'team-settings', projId?: string) => {
    setCurrentPage(page);
    if (projId) {
      setSelectedProjectId(projId);
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Workspace Switcher Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                TaskFlow
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Org Switcher Button & Dropdown */}
          <div className="relative" ref={orgDropdownRef}>
            <button
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                  {currentOrg.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {currentOrg.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {currentOrg.plan} · {currentOrg.membersCount} members
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0 ml-1" />
            </button>

            {/* Org Switcher Popover Menu */}
            {isOrgDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 animate-in fade-in duration-100">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Organizations
                </div>
                <div className="space-y-0.5">
                  {organizations.map(org => (
                    <button
                      key={org.id}
                      onClick={() => {
                        switchOrganization(org.id);
                        setIsOrgDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        currentOrg.id === org.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{org.name}</span>
                      </div>
                      {currentOrg.id === org.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="mt-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  {isCreatingOrg ? (
                    <form onSubmit={handleCreateOrgSubmit} className="p-1 space-y-1.5">
                      <input
                        type="text"
                        placeholder="Organization name..."
                        value={newOrgName}
                        onChange={e => setNewOrgName(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                      />
                      <select
                        value={newOrgTimezone}
                        onChange={e => setNewOrgTimezone(e.target.value)}
                        className="w-full px-2 py-1 text-[11px] rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
                      >
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Chicago">America/Chicago (CST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        <option value="Europe/London">Europe/London (GMT/BST)</option>
                        <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                        <option value="UTC">UTC</option>
                      </select>
                      <div className="flex justify-end gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setIsCreatingOrg(false)}
                          className="px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-0.5 text-[11px] bg-indigo-600 text-white rounded-md"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsCreatingOrg(true)}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Organization
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          {/* Main Views */}
          <div className="space-y-1">
            <button
              onClick={() => navTo('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentPage === 'dashboard'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navTo('team-settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                currentPage === 'team-settings'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team & Roles</span>
            </button>
          </div>

          {/* Projects List */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Projects
              </span>
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                title="Create Project"
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {currentOrgProjects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-400 italic">
                  No projects created yet.
                </div>
              ) : (
                currentOrgProjects.map(proj => {
                  const isActive = currentPage === 'project' && selectedProjectId === proj.id;
                  return (
                    <button
                      key={proj.id}
                      onClick={() => navTo('project', proj.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                        isActive
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color }}
                        />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                        {proj.key}
                      </span>
                    </button>
                  );
                })
              )}

              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-zinc-400" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invite Member Callout in Sidebar */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200/80 dark:border-zinc-800"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-800 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {currentUser?.initials || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {currentUser?.name || 'Guest'}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {currentUser?.role || 'Member'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
