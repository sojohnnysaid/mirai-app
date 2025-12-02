'use client';

import React, { useState } from 'react';
import { Brain, Check, Plus, X, AlertCircle } from 'lucide-react';
import { useListSMEs, type SubjectMatterExpert, SMEStatus } from '@/hooks/useSME';
import SMESelectionModal from './SMESelectionModal';

interface SMESelectionStepProps {
  selectedSmeIds: string[];
  onToggleSme: (smeId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canProceed: boolean;
}

export default function SMESelectionStep({
  selectedSmeIds,
  onToggleSme,
  onNext,
  onPrevious,
  canProceed,
}: SMESelectionStepProps) {
  const { data: allSmes, isLoading, error } = useListSMEs();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get selected SME objects
  const selectedSmes = allSmes.filter((sme) => selectedSmeIds.includes(sme.id));

  // Handle removing an SME
  const handleRemoveSme = (smeId: string) => {
    onToggleSme(smeId);
  };

  // Handle modal confirmation - sync selections
  const handleModalConfirm = (newSmeIds: string[]) => {
    // Find IDs to add (in newSmeIds but not in selectedSmeIds)
    const toAdd = newSmeIds.filter((id) => !selectedSmeIds.includes(id));
    // Find IDs to remove (in selectedSmeIds but not in newSmeIds)
    const toRemove = selectedSmeIds.filter((id) => !newSmeIds.includes(id));

    // Toggle each difference
    [...toAdd, ...toRemove].forEach((id) => onToggleSme(id));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-4">
          <Brain className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Select Knowledge Sources
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Choose the Subject Matter Experts (SMEs) whose knowledge will inform your course content.
          The AI will use these to generate accurate, relevant material.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading knowledge sources...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load SMEs. Please try again.</span>
          </div>
        </div>
      )}

      {/* Selected SMEs */}
      {!isLoading && (
        <div className="mb-8">
          {selectedSmes.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  Selected Knowledge Sources ({selectedSmes.length})
                </h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add More
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSmes.map((sme) => (
                  <SelectedSMECard
                    key={sme.id}
                    sme={sme}
                    onRemove={() => handleRemoveSme(sme.id)}
                  />
                ))}
              </div>

              {/* Selection Summary */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">
                    {selectedSmes.length} knowledge source{selectedSmes.length !== 1 ? 's' : ''} ready
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State - No SMEs Selected */
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Knowledge Sources Selected
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add SMEs to use their knowledge for generating course content.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add SME
              </button>
            </div>
          )}
        </div>
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
          Continue to Target Audience
        </button>
      </div>

      {/* SME Selection Modal */}
      <SMESelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedSmeIds={selectedSmeIds}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}

// ============================================================
// Selected SME Card Component
// ============================================================

interface SelectedSMECardProps {
  sme: SubjectMatterExpert;
  onRemove: () => void;
}

function SelectedSMECard({ sme, onRemove }: SelectedSMECardProps) {
  return (
    <div className="relative p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50">
      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Remove"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="pr-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {sme.name}
            </h3>
            <p className="text-sm text-indigo-600 font-medium">
              {sme.domain}
            </p>
            {sme.description && (
              <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                {sme.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
