'use client';

import React, { useState, useMemo } from 'react';
import {
  Brain,
  Check,
  Plus,
  Search,
  X,
  FileText,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import {
  useListSMEs,
  useCreateSME,
  SMEStatus,
  SMEScope,
  type SubjectMatterExpert,
} from '@/hooks/useSME';

interface SMESelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSmeIds: string[];
  onConfirm: (smeIds: string[]) => void;
}

type ModalView = 'list' | 'create';

export default function SMESelectionModal({
  isOpen,
  onClose,
  selectedSmeIds,
  onConfirm,
}: SMESelectionModalProps) {
  const { data: allSmes, isLoading: isLoadingSmes } = useListSMEs();
  const createSmeMutation = useCreateSME();

  // Local state for selections within modal
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedSmeIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ModalView>('list');

  // Create SME form state
  const [newSme, setNewSme] = useState({
    name: '',
    domain: '',
    description: '',
  });

  // Filter SMEs - show all statuses but indicate which are ready
  const filteredSmes = useMemo(() => {
    if (!searchQuery.trim()) return allSmes;
    const query = searchQuery.toLowerCase();
    return allSmes.filter(
      (sme) =>
        sme.name.toLowerCase().includes(query) ||
        sme.domain.toLowerCase().includes(query) ||
        sme.description?.toLowerCase().includes(query)
    );
  }, [allSmes, searchQuery]);

  // Active SMEs (ready for use)
  const activeSmes = useMemo(
    () => filteredSmes.filter((sme) => sme.status === SMEStatus.SME_STATUS_ACTIVE),
    [filteredSmes]
  );

  // Other SMEs (draft, ingesting, etc.)
  const otherSmes = useMemo(
    () => filteredSmes.filter((sme) => sme.status !== SMEStatus.SME_STATUS_ACTIVE),
    [filteredSmes]
  );

  const toggleSme = (smeId: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(smeId) ? prev.filter((id) => id !== smeId) : [...prev, smeId]
    );
  };

  const handleConfirm = () => {
    onConfirm(localSelectedIds);
    onClose();
  };

  const handleCreateSme = async () => {
    if (!newSme.name.trim() || !newSme.domain.trim()) return;

    try {
      const result = await createSmeMutation.mutate({
        name: newSme.name.trim(),
        domain: newSme.domain.trim(),
        description: newSme.description.trim() || undefined,
        scope: SMEScope.SME_SCOPE_GLOBAL,
      });

      if (result.sme) {
        // Auto-select the newly created SME
        setLocalSelectedIds((prev) => [...prev, result.sme!.id]);
        // Reset form and go back to list
        setNewSme({ name: '', domain: '', description: '' });
        setView('list');
      }
    } catch (error) {
      console.error('Failed to create SME:', error);
    }
  };

  const getStatusLabel = (status: SMEStatus): string => {
    switch (status) {
      case SMEStatus.SME_STATUS_DRAFT:
        return 'Draft';
      case SMEStatus.SME_STATUS_INGESTING:
        return 'Processing';
      case SMEStatus.SME_STATUS_ACTIVE:
        return 'Ready';
      case SMEStatus.SME_STATUS_ARCHIVED:
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: SMEStatus): string => {
    switch (status) {
      case SMEStatus.SME_STATUS_DRAFT:
        return 'bg-gray-100 text-gray-600';
      case SMEStatus.SME_STATUS_INGESTING:
        return 'bg-yellow-100 text-yellow-700';
      case SMEStatus.SME_STATUS_ACTIVE:
        return 'bg-green-100 text-green-700';
      case SMEStatus.SME_STATUS_ARCHIVED:
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          {view === 'create' ? (
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to list</span>
            </button>
          ) : (
            <h2 className="text-xl font-semibold text-gray-900">Select Knowledge Sources</h2>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {view === 'list' ? (
          <>
            {/* Search and Create */}
            <div className="px-6 py-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setView('create')}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Create New SME
              </button>
            </div>

            {/* SME List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoadingSmes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : filteredSmes.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {searchQuery ? 'No SMEs match your search' : 'No SMEs available'}
                  </p>
                  <button
                    onClick={() => setView('create')}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    Create First SME
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ready SMEs */}
                  {activeSmes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Ready for Use</h3>
                      <div className="space-y-2">
                        {activeSmes.map((sme) => (
                          <SMEListItem
                            key={sme.id}
                            sme={sme}
                            isSelected={localSelectedIds.includes(sme.id)}
                            onToggle={() => toggleSme(sme.id)}
                            statusLabel={getStatusLabel(sme.status)}
                            statusColor={getStatusColor(sme.status)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other SMEs */}
                  {otherSmes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">
                        Not Ready ({otherSmes.length})
                      </h3>
                      <div className="space-y-2 opacity-60">
                        {otherSmes.map((sme) => (
                          <SMEListItem
                            key={sme.id}
                            sme={sme}
                            isSelected={false}
                            onToggle={() => {}}
                            disabled
                            statusLabel={getStatusLabel(sme.status)}
                            statusColor={getStatusColor(sme.status)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-600">
                {localSelectedIds.length} selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Create SME View */
          <div className="flex-1 px-6 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Create New Knowledge Source</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSme.name}
                  onChange={(e) => setNewSme((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Customer Support Expert"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSme.domain}
                  onChange={(e) => setNewSme((prev) => ({ ...prev, domain: e.target.value }))}
                  placeholder="e.g., Customer Service, Sales, Engineering"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newSme.description}
                  onChange={(e) => setNewSme((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this knowledge source..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <p className="text-sm text-gray-500">
                After creating, you&apos;ll need to add knowledge content to this SME before it can be used for course generation.
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setView('list')}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSme}
                disabled={!newSme.name.trim() || !newSme.domain.trim() || createSmeMutation.isLoading}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createSmeMutation.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create SME
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SME List Item Component
// ============================================================

interface SMEListItemProps {
  sme: SubjectMatterExpert;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  statusLabel: string;
  statusColor: string;
}

function SMEListItem({
  sme,
  isSelected,
  onToggle,
  disabled,
  statusLabel,
  statusColor,
}: SMEListItemProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${isSelected
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
      `}
    >
      {/* Selection indicator */}
      <div
        className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}
        `}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isSelected ? 'bg-indigo-100' : 'bg-gray-100'
      }`}>
        <Brain className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">{sme.name}</h4>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-sm text-indigo-600 font-medium">{sme.domain}</p>
        {sme.description && (
          <p className="text-sm text-gray-500 truncate mt-0.5">{sme.description}</p>
        )}
      </div>
    </button>
  );
}
