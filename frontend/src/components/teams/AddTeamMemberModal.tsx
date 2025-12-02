'use client';

import { useState } from 'react';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { useAddTeamMember, TeamRole } from '@/hooks/useTeams';

interface AddTeamMemberModalProps {
  teamId: string;
  existingMemberIds: string[];
  onClose: () => void;
}

const ROLE_OPTIONS = [
  { value: TeamRole.MEMBER, label: 'Member', description: 'Regular team member' },
  { value: TeamRole.LEAD, label: 'Lead', description: 'Can manage team settings and members' },
];

export function AddTeamMemberModal({ teamId, existingMemberIds, onClose }: AddTeamMemberModalProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<TeamRole>(TeamRole.MEMBER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = useAddTeamMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check if user is already a member
    if (existingMemberIds.includes(userId)) {
      setError('This user is already a member of this team');
      setLoading(false);
      return;
    }

    try {
      await addMember.mutate({
        teamId,
        userId,
        role,
      });
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add team member');
      }
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal isOpen={true} onClose={onClose} title="Add Team Member">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 space-y-4">
          {/* User ID Input */}
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              id="userId"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base border-gray-300 rounded-md px-3 py-3 lg:py-2 border min-h-[44px]"
              placeholder="Enter user ID..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the unique identifier of the user you want to add
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    role === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => setRole(option.value)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                    <span className="block text-xs text-gray-500">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-3 lg:py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !userId.trim()}
            className="w-full sm:w-auto px-4 py-3 lg:py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
