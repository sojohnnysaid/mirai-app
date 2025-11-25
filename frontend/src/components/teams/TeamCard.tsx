'use client';

import Link from 'next/link';
import { Team } from '@/lib/api/client';

interface TeamCardProps {
  team: Team;
  onDelete: () => void;
}

export function TeamCard({ team, onDelete }: TeamCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {team.name}
          </h3>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
            title="Delete team"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {team.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {team.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>View members</span>
          </div>

          <Link
            href={`/teams/${team.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Manage
          </Link>
        </div>

        <div className="mt-2 text-xs text-gray-400">
          Created {new Date(team.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
