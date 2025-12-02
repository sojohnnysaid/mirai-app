'use client';

import React from 'react';
import { Sparkles, BookOpen, Brain, Users, Check, Target, ChevronRight, Loader2 } from 'lucide-react';
import { useListSMEs, type SubjectMatterExpert } from '@/hooks/useSME';
import { useListTargetAudiences, type TargetAudienceTemplate } from '@/hooks/useTargetAudience';

interface ReviewGenerateStepProps {
  title: string;
  desiredOutcome: string;
  selectedSmeIds: string[];
  selectedAudienceIds: string[];
  isGenerating: boolean;
  onGenerate: () => void;
  onPrevious: () => void;
  onEditStep: (step: number) => void;
}

export default function ReviewGenerateStep({
  title,
  desiredOutcome,
  selectedSmeIds,
  selectedAudienceIds,
  isGenerating,
  onGenerate,
  onPrevious,
  onEditStep,
}: ReviewGenerateStepProps) {
  const { data: allSmes } = useListSMEs();
  const { data: allAudiences } = useListTargetAudiences();

  // Get selected items
  const selectedSmes = allSmes.filter((sme) => selectedSmeIds.includes(sme.id));
  const selectedAudiences = allAudiences.filter((a) => selectedAudienceIds.includes(a.id));

  const canGenerate = title.trim() && desiredOutcome.trim() && selectedSmeIds.length > 0 && selectedAudienceIds.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ready to Generate
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Review your selections below. The AI will create a comprehensive course outline
          for your review before generating the full content.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4 mb-8">
        {/* Course Info */}
        <SummaryCard
          icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
          title="Course Information"
          onEdit={() => onEditStep(1)}
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Title</p>
              <p className="text-gray-900 font-medium">{title || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Learning Goal</p>
              <p className="text-gray-700 text-sm">{desiredOutcome || 'Not set'}</p>
            </div>
          </div>
        </SummaryCard>

        {/* Knowledge Sources */}
        <SummaryCard
          icon={<Brain className="w-5 h-5 text-purple-600" />}
          title="Knowledge Sources"
          count={selectedSmes.length}
          onEdit={() => onEditStep(2)}
        >
          {selectedSmes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedSmes.map((sme) => (
                <span
                  key={sme.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm"
                >
                  <Brain className="w-3.5 h-3.5" />
                  {sme.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No SMEs selected</p>
          )}
        </SummaryCard>

        {/* Target Audiences */}
        <SummaryCard
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          title="Target Audiences"
          count={selectedAudiences.length}
          onEdit={() => onEditStep(3)}
        >
          {selectedAudiences.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedAudiences.map((audience) => (
                <span
                  key={audience.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                >
                  <Users className="w-3.5 h-3.5" />
                  {audience.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No audiences selected</p>
          )}
        </SummaryCard>
      </div>

      {/* What Happens Next */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
        <div className="space-y-3">
          <Step number={1} text="AI analyzes your SME knowledge and audience needs" />
          <Step number={2} text="A course outline is generated for your review" />
          <Step number={3} text="You can edit, approve, or regenerate the outline" />
          <Step number={4} text="Full lesson content is generated from the approved outline" />
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={onPrevious}
          disabled={isGenerating}
          className="px-6 py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Back
        </button>

        <button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="group px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Course
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Summary Card Component
// ============================================================

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
  onEdit: () => void;
  children: React.ReactNode;
}

function SummaryCard({ icon, title, count, onEdit, children }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {count !== undefined && (
            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
              {count}
            </span>
          )}
        </div>
        <button
          onClick={onEdit}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Edit
        </button>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Step Component
// ============================================================

interface StepProps {
  number: number;
  text: string;
}

function Step({ number, text }: StepProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {number}
      </div>
      <p className="text-gray-700 text-sm">{text}</p>
    </div>
  );
}
