'use client';

import React from 'react';
import { Users, Check, Briefcase, GraduationCap, Plus, AlertCircle } from 'lucide-react';
import { useListTargetAudiences, type TargetAudienceTemplate, ExperienceLevel } from '@/hooks/useTargetAudience';
import Link from 'next/link';

interface AudienceSelectionStepProps {
  selectedAudienceIds: string[];
  onToggleAudience: (audienceId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canProceed: boolean;
}

export default function AudienceSelectionStep({
  selectedAudienceIds,
  onToggleAudience,
  onNext,
  onPrevious,
  canProceed,
}: AudienceSelectionStepProps) {
  const { data: audiences, isLoading, error } = useListTargetAudiences();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 mb-4">
          <Users className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Who is this course for?
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Select your target audience. The AI will tailor the content, examples, and language
          to match their experience level and learning goals.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading audiences...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load audiences. Please try again.</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && audiences.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Target Audiences Defined
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Define who your courses are for. This helps the AI create relevant, tailored content.
          </p>
          <Link
            href="/target-audiences"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Target Audience
          </Link>
        </div>
      )}

      {/* Audience Grid */}
      {!isLoading && audiences.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {audiences.map((audience) => (
              <AudienceCard
                key={audience.id}
                audience={audience}
                isSelected={selectedAudienceIds.includes(audience.id)}
                onToggle={() => onToggleAudience(audience.id)}
              />
            ))}
          </div>

          {/* Selection Summary */}
          {selectedAudienceIds.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2 text-emerald-700">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  {selectedAudienceIds.length} audience{selectedAudienceIds.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Review & Generate
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Audience Card Component
// ============================================================

interface AudienceCardProps {
  audience: TargetAudienceTemplate;
  isSelected: boolean;
  onToggle: () => void;
}

function AudienceCard({ audience, isSelected, onToggle }: AudienceCardProps) {
  const experienceLevelLabel = getExperienceLevelLabel(audience.experienceLevel);

  return (
    <button
      onClick={onToggle}
      className={`
        relative w-full text-left p-5 rounded-xl border-2 transition-all
        ${isSelected
          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Selection Indicator */}
      <div className={`
        absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
        ${isSelected
          ? 'bg-emerald-600 border-emerald-600'
          : 'border-gray-300 bg-white'
        }
      `}>
        {isSelected && <Check className="w-4 h-4 text-white" />}
      </div>

      {/* Content */}
      <div className="pr-10">
        <div className="flex items-start gap-3 mb-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
            ${isSelected ? 'bg-emerald-100' : 'bg-gray-100'}
          `}>
            <Users className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-gray-500'}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {audience.name}
            </h3>
            {audience.role && (
              <p className="text-sm text-emerald-600 font-medium">
                {audience.role}
              </p>
            )}
          </div>
        </div>

        {audience.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {audience.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-3 text-xs">
          {experienceLevelLabel && (
            <div className="flex items-center gap-1 text-gray-500">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{experienceLevelLabel}</span>
            </div>
          )}
          {audience.industryContext && (
            <div className="flex items-center gap-1 text-gray-500">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px]">{audience.industryContext}</span>
            </div>
          )}
        </div>

        {/* Learning Goals Preview */}
        {audience.learningGoals && audience.learningGoals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Learning goals:</p>
            <p className="text-xs text-gray-700 line-clamp-1">
              {audience.learningGoals.slice(0, 2).join(', ')}
              {audience.learningGoals.length > 2 && ` +${audience.learningGoals.length - 2} more`}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// ============================================================
// Helpers
// ============================================================

function getExperienceLevelLabel(level: ExperienceLevel): string {
  switch (level) {
    case ExperienceLevel.BEGINNER:
      return 'Beginner';
    case ExperienceLevel.INTERMEDIATE:
      return 'Intermediate';
    case ExperienceLevel.ADVANCED:
      return 'Advanced';
    case ExperienceLevel.EXPERT:
      return 'Expert';
    default:
      return '';
  }
}
