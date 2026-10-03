import React, { useState } from 'react';
import { useTaskFlow } from '../../mock-data/store';
import { UserRole } from '../../types';
import { X, Mail, Shield, Check, Copy, UserCheck } from 'lucide-react';

export const InviteModal: React.FC = () => {
  const { isInviteModalOpen, setIsInviteModalOpen, inviteMember, currentOrg } = useTaskFlow();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Member');
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isInviteModalOpen) return null;

  const roles: { role: UserRole; title: string; desc: string }[] = [
    {
      role: 'Member',
      title: 'Member',
      desc: 'Can create and edit tasks, upload attachments, and comment on projects.',
    },
    {
      role: 'Admin',
      title: 'Admin',
      desc: 'Can manage projects, configure board columns, and invite new members.',
    },
    {
      role: 'Owner',
      title: 'Owner',
      desc: 'Full workspace governance, billing controls, and organization deletion.',
    },
  ];

  const inviteLink = `https://taskflow.io/join/${currentOrg.slug}?token=${Math.random().toString(36).substring(2, 10)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid corporate email address.');
      return;
    }
    setError('');
    inviteMember(email.trim(), selectedRole);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
      setIsInviteModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Invite to {currentOrg.name}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Send an email invite or share an invitation link with role permissions.
            </p>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Invitation Dispatched!
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              {email} has been invited with {selectedRole} privileges.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Email input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400"
                  autoFocus
                />
              </div>
              {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Select Workspace Role
              </label>
              <div className="space-y-2">
                {roles.map(item => (
                  <label
                    key={item.role}
                    onClick={() => setSelectedRole(item.role)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRole === item.role
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-800/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={item.role}
                      checked={selectedRole === item.role}
                      onChange={() => setSelectedRole(item.role)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </span>
                        {item.role === 'Owner' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium">
                            Full Control
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    {selectedRole === item.role && (
                      <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Link sharing */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">
                Or share via secure direct link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono truncate border border-zinc-200 dark:border-zinc-700 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl transition-colors shadow-xs"
              >
                Send Invitation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
