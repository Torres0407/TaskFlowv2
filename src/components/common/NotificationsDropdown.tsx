import React, { useRef, useEffect } from 'react';
import { useTaskFlow } from '../../mock-data/store';
import { Bell, CheckCheck, Clock, MessageSquare, AlertCircle, UserPlus, FolderKanban } from 'lucide-react';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setSelectedProjectId,
    setSelectedTask,
    setCurrentPage,
    tasks,
  } = useTaskFlow();

  const [activeTab, setActiveTab] = React.useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    if (notif.projectId) {
      setSelectedProjectId(notif.projectId);
      setCurrentPage('project');
    }
    if (notif.taskId) {
      const task = tasks.find(t => t.id === notif.taskId);
      if (task) {
        setSelectedTask(task);
      }
    }
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'deadline':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'assignment':
        return <FolderKanban className="w-4 h-4 text-indigo-500" />;
      case 'team':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-3.5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notifications</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-medium">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </div>
        <button
          onClick={markAllNotificationsAsRead}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all read
        </button>
      </div>

      <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-3 pt-2 gap-3 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 border-b-2 font-medium transition-colors ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`pb-2 border-b-2 font-medium transition-colors ${
            activeTab === 'unread'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Unread
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {filteredNotifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No {activeTab === 'unread' ? 'unread ' : ''}notifications
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                !notif.read ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
              }`}
            >
              <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {notif.title}
                  </p>
                  <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {notif.description}
                </p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
