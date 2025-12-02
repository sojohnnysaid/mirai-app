'use client';

import { useState, useEffect } from 'react';
import { SMEList } from '@/components/sme/SMEList';
import { CreateSMEModal, type CreateSMEData } from '@/components/sme/CreateSMEModal';
import { EditSMEModal, type UpdateSMEData } from '@/components/sme/EditSMEModal';
import { SMEDetailPanel } from '@/components/sme/SMEDetailPanel';
import { useListSMEs, useDeleteSME, useCreateSME, useUpdateSME, useRestoreSME, type SubjectMatterExpert } from '@/hooks/useSME';
import { useListTeams } from '@/hooks/useTeams';

export default function SMEsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSME, setSelectedSME] = useState<SubjectMatterExpert | null>(null);
  const [editingSME, setEditingSME] = useState<SubjectMatterExpert | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // RTK Query hooks for data fetching
  const { data: smes, isLoading, error } = useListSMEs({ includeArchived: showArchived });
  const { data: teams = [], isLoading: teamsLoading } = useListTeams();
  const deleteSME = useDeleteSME();
  const createSME = useCreateSME();
  const updateSME = useUpdateSME();
  const restoreSME = useRestoreSME();

  // Debug logging for teams
  useEffect(() => {
    if (teams.length === 0 && !teamsLoading) {
      console.warn('[SMEsPage] No teams available for selection');
    } else if (teams.length > 0) {
      console.log('[SMEsPage] Teams loaded:', teams.length);
    }
  }, [teams, teamsLoading]);

  const handleDelete = async (sme: SubjectMatterExpert) => {
    if (!confirm(`Are you sure you want to delete "${sme.name}"?`)) {
      return;
    }

    try {
      await deleteSME.mutate(sme.id);
      // Query cache is automatically invalidated by the hook
    } catch (err) {
      console.error('Failed to delete SME:', err);
      alert('Failed to delete SME. Please try again.');
    }
  };

  const handleCreate = async (data: CreateSMEData) => {
    await createSME.mutate({
      name: data.name,
      description: data.description,
      domain: data.domain,
      scope: data.scope,
      teamIds: data.teamIds,
    });
    setShowCreateModal(false);
    // Query cache is automatically invalidated by the hook
  };

  const handleEdit = (sme: SubjectMatterExpert) => {
    setEditingSME(sme);
  };

  const handleUpdate = async (smeId: string, data: UpdateSMEData) => {
    await updateSME.mutate(smeId, {
      name: data.name,
      description: data.description,
      domain: data.domain,
      scope: data.scope,
    });
    setEditingSME(null);
    // If we were editing the selected SME, update the selection with fresh data
    if (selectedSME?.id === smeId) {
      // The cache will be invalidated and the list will refresh
      // For now, close the detail panel to avoid stale data
      setSelectedSME(null);
    }
  };

  const handleRestore = async (sme: SubjectMatterExpert) => {
    try {
      await restoreSME.mutate(sme.id);
      // Query cache is automatically invalidated by the hook
    } catch (err) {
      console.error('Failed to restore SME:', err);
      alert('Failed to restore SME. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Failed to load SMEs. Please try refreshing the page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SMEList
        smes={smes}
        isLoading={isLoading}
        showArchived={showArchived}
        onToggleArchived={setShowArchived}
        onSelect={setSelectedSME}
        onCreate={() => setShowCreateModal(true)}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onRestore={handleRestore}
      />

      {/* Create SME Modal */}
      {showCreateModal && (
        <CreateSMEModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          teams={teams.map(t => ({ id: t.id, name: t.name }))}
        />
      )}

      {/* SME Detail Panel (slide-over) */}
      {selectedSME && (
        <SMEDetailPanel
          sme={selectedSME}
          onBack={() => setSelectedSME(null)}
          onEdit={() => handleEdit(selectedSME)}
          onRestore={() => handleRestore(selectedSME)}
          onDelete={() => handleDelete(selectedSME)}
        />
      )}

      {/* Edit SME Modal */}
      {editingSME && (
        <EditSMEModal
          sme={editingSME}
          onClose={() => setEditingSME(null)}
          onSave={handleUpdate}
          teams={teams.map(t => ({ id: t.id, name: t.name }))}
        />
      )}
    </div>
  );
}
