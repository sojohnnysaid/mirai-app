'use client';

import { useState } from 'react';
import type { TargetAudienceTemplate, TargetAudienceStatus } from '@/gen/mirai/v1/target_audience_pb';

interface TargetAudienceDetailPanelProps {
  template: TargetAudienceTemplate;
  onBack: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

const STATUS_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: 'Unknown', color: 'bg-gray-100 text-gray-800' },
  1: { label: 'Active', color: 'bg-green-100 text-green-800' },
  2: { label: 'Archived', color: 'bg-gray-100 text-gray-600' },
};

const EXPERIENCE_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Unspecified', color: 'bg-gray-100 text-gray-700' },
  1: { label: 'Beginner', color: 'bg-green-100 text-green-800' },
  2: { label: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'Advanced', color: 'bg-purple-100 text-purple-800' },
  4: { label: 'Expert', color: 'bg-amber-100 text-amber-800' },
};

export function TargetAudienceDetailPanel({
  template,
  onBack,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: TargetAudienceDetailPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const status = STATUS_CONFIG[template.status] || STATUS_CONFIG[0];
  const experience = EXPERIENCE_LABELS[template.experienceLevel] || EXPERIENCE_LABELS[0];
  const isArchived = template.status === 2; // TARGET_AUDIENCE_STATUS_ARCHIVED

  const renderList = (items: string[], emptyText: string, markerColor: string = 'text-gray-400') => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-gray-400 italic">{emptyText}</p>;
    }
    return (
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start text-sm text-gray-700">
            <span className={`mr-2 ${markerColor}`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to list
          </button>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="mt-4">
          <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
          {template.description && <p className="mt-1 text-sm text-gray-500">{template.description}</p>}
        </div>

        {/* Role & Experience Level */}
        <div className="mt-4 flex flex-wrap gap-2">
          {template.role && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
              {template.role}
            </span>
          )}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${experience.color}`}>
            {experience.label}
          </span>
        </div>
      </div>

      {/* Learning Goals */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Learning Goals</h3>
        {renderList(template.learningGoals, 'No learning goals defined', 'text-green-500')}
      </div>

      {/* Prerequisites */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Prerequisites</h3>
        {renderList(template.prerequisites, 'No prerequisites defined', 'text-blue-500')}
      </div>

      {/* Challenges */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Challenges</h3>
        {renderList(template.challenges, 'No challenges defined', 'text-amber-500')}
      </div>

      {/* Motivations */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Motivations</h3>
        {renderList(template.motivations, 'No motivations defined', 'text-purple-500')}
      </div>

      {/* Additional Context */}
      {(template.industryContext || template.typicalBackground) && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Additional Context</h3>
          <div className="space-y-4">
            {template.industryContext && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Industry Context
                </h4>
                <p className="text-sm text-gray-700">{template.industryContext}</p>
              </div>
            )}
            {template.typicalBackground && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Typical Background
                </h4>
                <p className="text-sm text-gray-700">{template.typicalBackground}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-4 sm:px-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-3">
          {/* Edit button - only for non-archived items */}
          {onEdit && !isArchived && (
            <button
              onClick={onEdit}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Template
            </button>
          )}

          {/* Archive button - only for active items */}
          {onArchive && !isArchived && (
            <button
              onClick={onArchive}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              Archive
            </button>
          )}

          {/* Restore button - only for archived items */}
          {onRestore && isArchived && (
            <button
              onClick={onRestore}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Restore Template
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Are you sure?</span>
                  <button
                    onClick={onDelete}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="px-4 py-3 sm:px-6 text-xs text-gray-400">
        <div className="flex flex-wrap gap-4">
          {template.createdAt && (
            <span>Created: {new Date(Number(template.createdAt.seconds) * 1000).toLocaleString()}</span>
          )}
          {template.updatedAt && (
            <span>Updated: {new Date(Number(template.updatedAt.seconds) * 1000).toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
