import React from 'react';
import { Task } from '../../types';
import { useUsers } from '../../mock-data/store';
import {
  Paperclip,
  MessageSquare,
  Calendar,
  AlertCircle,
  GripVertical,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOverCard?: (e: React.DragEvent, targetIndex: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  onClick,
  onDragStart,
  onDragOverCard,
}) => {
  const { getUserById } = useUsers();
  const assignee = getUserById(task.assigneeId);

  // Check if task is overdue
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.status !== 'DONE' && task.dueDate < today;
  const isDueSoon =
    task.status !== 'DONE' &&
    !isOverdue &&
    task.dueDate <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const getPriorityStyle = () => {
    switch (task.priority) {
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
    <div
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      onDragOver={e => {
        if (onDragOverCard) {
          e.preventDefault();
          e.stopPropagation();
          onDragOverCard(e, index);
        }
      }}
      onClick={onClick}
      className="group relative p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none"
    >
      {/* Top row: Key & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3 h-3 text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] font-mono font-medium text-zinc-500">
            {task.key}
          </span>
        </div>

        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-medium border uppercase tracking-wider ${getPriorityStyle()}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-1.5 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Bottom Row: Metadata (Due date, Attachments, Comments, Assignee) */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-zinc-400 text-xs">
        <div className="flex items-center gap-3">
          {/* Due date */}
          <div
            className={`flex items-center gap-1 text-[11px] font-mono ${
              isOverdue
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : isDueSoon
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-500'
            }`}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3 text-red-500" />
            ) : (
              <Calendar className="w-3 h-3" />
            )}
            <span>{task.dueDate.substring(5)}</span>
          </div>

          {/* Attachments count */}
          {task.attachments.length > 0 && (
            <div className="flex items-center gap-0.5 text-[11px] font-mono text-zinc-500">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}

          {/* Comments count */}
          {task.comments.length > 0 && (
            <div className="flex items-center gap-0.5 text-[11px] font-mono text-zinc-500">
              <MessageSquare className="w-3 h-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {assignee ? (
          assignee.avatar ? (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              title={assignee.name}
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
            />
          ) : (
            <div
              title={assignee.name}
              className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[9px] font-bold"
            >
              {assignee.initials}
            </div>
          )
        ) : (
          <div
            title="Unassigned"
            className="w-5 h-5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[9px] text-zinc-400"
          >
            -
          </div>
        )}
      </div>
    </div>
  );
};
