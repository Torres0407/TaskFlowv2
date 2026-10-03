import React, { useState } from 'react';
import { useTaskFlow } from '../mock-data/store';
import { UserRole } from '../types';
import {
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Mail,
  Lock,
  Clock,
  UserCheck,
  Ban,
} from 'lucide-react';

export const TeamSettingsPage: React.FC = () => {
  const {
    currentOrg,
    memberships,
    invitations,
    updateMemberRole,
    removeMember,
    revokeInvitation,
    acceptInvitation,
    setIsInviteModalOpen,
    currentUser,
  } = useTaskFlow();

  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const orgMembers = memberships.filter(m => m.orgId === currentOrg.id);
  const orgInvitations = invitations.filter(i => i.orgId === currentOrg.id && !i.acceptedAt);

  const handleRoleChange = (memberId: string, newRole: UserRole) => {
    updateMemberRole(memberId, newRole);
  };

  const handleConfirmRemove = (memberId: string) => {
    removeMember(memberId);
    setMemberToRemove(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Team & Permissions
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {orgMembers.length} active
            </span>
            {orgInvitations.length > 0 && (
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                {orgInvitations.length} pending
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Manage organization members, seat allocation, and workspace governance for {currentOrg.name}.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Role Explainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Owner</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Full root authority. Can manage billing, domain verification, role assignments, and workspace termination.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Admin</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Can create projects, invite team members, adjust board structures, and manage integrations.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Member</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Can create, move, and edit assigned tasks, attach documentation, and post comments.
          </p>
        </div>
      </div>

      {/* Pending Invitations Section */}
      {orgInvitations.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-amber-100 dark:border-amber-950/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Pending Invitations ({orgInvitations.length})
              </h2>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Awaiting recipient acceptance
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invited Email</th>
                  <th className="py-3 px-4">Invited Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {orgInvitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{inv.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium capitalize">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {inv.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400">
                        <Clock className="w-3 h-3" />
                        <span>pending</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      {inv.token}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Demo Action: Accept Invitation */}
                        <button
                          onClick={() => acceptInvitation(inv.token)}
                          title="Simulate user clicking invite link and accepting"
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Accept (Demo)</span>
                        </button>

                        {/* Revoke Invitation */}
                        <button
                          onClick={() => revokeInvitation(inv.id)}
                          title="Revoke invitation"
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Members Table */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Active Members ({orgMembers.length})
          </h2>
          <span className="text-xs text-zinc-400 font-mono">Plan: {currentOrg.plan}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Security (2FA)</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {orgMembers.map(member => {
                const isCurrent = currentUser?.id === member.user.id;
                const isOnlyOwner =
                  member.role === 'Owner' &&
                  orgMembers.filter(m => m.role === 'Owner').length <= 1;

                return (
                  <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                            {member.user.initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {member.user.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={member.role}
                        disabled={isOnlyOwner}
                        onChange={e => handleRoleChange(member.id, e.target.value as UserRole)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg border focus:outline-hidden ${
                          member.role === 'Owner'
                            ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : member.role === 'Admin'
                            ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        <option value="Owner">Owner</option>
                        <option value="Admin">Admin</option>
                        <option value="Member">Member</option>
                      </select>
                      {isOnlyOwner && (
                        <p className="text-[10px] text-zinc-400 mt-0.5">Primary owner</p>
                      )}
                    </td>

                    {/* 2FA Status */}
                    <td className="py-3.5 px-4">
                      {member.user.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Enforced</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Not Configured</span>
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                      {member.joinedDate.includes('T')
                        ? member.joinedDate.split('T')[0]
                        : member.joinedDate}
                    </td>

                    {/* Remove Action */}
                    <td className="py-3.5 px-4 text-right">
                      {memberToRemove === member.id ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="text-[11px] text-red-500 font-medium">Remove?</span>
                          <button
                            onClick={() => handleConfirmRemove(member.id)}
                            className="px-2 py-0.5 text-[11px] bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setMemberToRemove(null)}
                            className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-600"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={isOnlyOwner || isCurrent}
                          onClick={() => setMemberToRemove(member.id)}
                          title={isOnlyOwner ? 'Cannot remove the sole owner' : 'Remove member'}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:text-zinc-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
