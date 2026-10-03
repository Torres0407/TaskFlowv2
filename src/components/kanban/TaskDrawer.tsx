import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaskFlow } from '../../mock-data/store';
import { Task, TaskPriority, TaskStatus } from '../../types';
import {
  X,
  Trash2,
  Calendar,
  User as UserIcon,
  Flag,
  MessageSquare,
  Paperclip,
  Send,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileImage,
  Upload,
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
} from 'lucide-react';

interface TaskDrawerProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({ task, onClose }) => {
  const { updateTask, deleteTask, addComment, addAttachment, currentUser, users } = useTaskFlow();

  const [newCommentText, setNewCommentText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task?.title || '');
  const [descriptionValue, setDescriptionValue] = useState(task?.description || '');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync state when active task changes
  React.useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescriptionValue(task.description);
      setConfirmDelete(false);
    }
  }, [task?.id, task?.title, task?.description]);

  if (!task) return null;

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== task.title) {
      updateTask(task.id, { title: titleValue.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false);
    if (descriptionValue !== task.description) {
      updateTask(task.id, { description: descriptionValue.trim() });
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(task.id, newCommentText.trim());
    setNewCommentText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      addAttachment(task.id, {
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/octet-stream',
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext || '')) {
      return <FileImage className="w-4 h-4 text-emerald-500" />;
    }
    if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
      return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
    }
    if (['ts', 'tsx', 'js', 'json', 'py', 'sh'].includes(ext || '')) {
      return <FileCode className="w-4 h-4 text-amber-500" />;
    }
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'urgent': return 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900';
      case 'high': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
      case 'medium': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900';
      case 'low': return 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="absolute inset-y-0 right-0 max-w-full w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {task.key}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400">in</span>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 capitalize">
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {confirmDelete ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="text-xs text-red-500 font-medium">Delete task?</span>
                  <button
                    onClick={() => {
                      deleteTask(task.id);
                      onClose();
                    }}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Delete Task"
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
            {/* Title */}
            <div>
              {isEditingTitle ? (
                <textarea
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  onBlur={handleTitleBlur}
                  rows={2}
                  className="w-full text-lg font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/70 border border-indigo-500 rounded-xl p-2.5 focus:outline-hidden resize-none"
                  autoFocus
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="text-lg font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 p-1.5 -ml-1.5 rounded-lg transition-colors"
                  title="Click to edit title"
                >
                  {task.title}
                </h2>
              )}
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={task.status}
                  onChange={e => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <select
                  value={task.priority}
                  onChange={e => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-hidden font-medium capitalize ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Assignee
                </label>
                <select
                  value={task.assigneeId || ''}
                  onChange={e => updateTask(task.id, { assigneeId: e.target.value || undefined })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={task.dueDate}
                  onChange={e => updateTask(task.id, { dueDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Description
                </span>
                {!isEditingDescription && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={descriptionValue}
                    onChange={e => setDescriptionValue(e.target.value)}
                    rows={4}
                    placeholder="Add a detailed description..."
                    className="w-full p-3 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-y"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setDescriptionValue(task.description);
                        setIsEditingDescription(false);
                      }}
                      className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDescriptionBlur}
                      className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDescription(true)}
                  className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 min-h-[72px]"
                >
                  {task.description ? (
                    task.description
                  ) : (
                    <span className="text-zinc-400 italic">No description provided. Click to add.</span>
                  )}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Attachments ({task.attachments.length})
                  </span>
                </div>

                <label className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {task.attachments.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                  No attachments yet. Drop or upload specification documents, diagrams, or assets.
                </div>
              ) : (
                <div className="space-y-2">
                  {task.attachments.map(att => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0">
                          {getFileIcon(att.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {att.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-mono">
                            {att.size} · uploaded by {att.uploaderName}
                          </p>
                        </div>
                      </div>

                      <button
                        title="Download attachment"
                        onClick={() => {
                          // Simulated download action
                          alert(`Simulated download for: ${att.name}`);
                        }}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Thread */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Activity & Comments ({task.comments.length})
                </span>
              </div>

              {/* Comments List */}
              <div className="space-y-3 mb-4">
                {task.comments.map(c => (
                  <div key={c.id} className="flex items-start gap-3 text-xs">
                    {c.authorAvatar ? (
                      <img
                        src={c.authorAvatar}
                        alt={c.authorName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800 shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                        {c.authorInitials}
                      </div>
                    )}
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {c.authorName}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {c.createdAt}
                        </span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment Box */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment or update..."
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-400"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
