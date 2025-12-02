'use client';

import { useState } from 'react';
import { TargetAudienceList } from '@/components/target-audience/TargetAudienceList';
import { TargetAudienceDetailPanel } from '@/components/target-audience/TargetAudienceDetailPanel';
import { CreateTargetAudienceModal, type CreateTargetAudienceData } from '@/components/target-audience/CreateTargetAudienceModal';
import { EditTargetAudienceModal } from '@/components/target-audience/EditTargetAudienceModal';
import {
  useListTargetAudiences,
  useDeleteTargetAudience,
  useCreateTargetAudience,
  useUpdateTargetAudience,
  useArchiveTargetAudience,
  useRestoreTargetAudience,
  type TargetAudienceTemplate,
  type ExperienceLevel,
} from '@/hooks/useTargetAudience';

export default function TargetAudiencesPage() {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TargetAudienceTemplate | null>(null);

  // View state
  const [selectedTemplate, setSelectedTemplate] = useState<TargetAudienceTemplate | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // RTK Query hooks for data fetching
  const { data: templates, isLoading, error } = useListTargetAudiences({ includeArchived: showArchived });
  const createTemplate = useCreateTargetAudience();
  const updateTemplate = useUpdateTargetAudience();
  const deleteTemplate = useDeleteTargetAudience();
  const archiveTemplate = useArchiveTargetAudience();
  const restoreTemplate = useRestoreTargetAudience();

  const handleCreate = async (data: CreateTargetAudienceData) => {
    await createTemplate.mutate({
      name: data.name,
      description: data.description,
      role: data.role,
      experienceLevel: data.experienceLevel,
      learningGoals: data.learningGoals,
      prerequisites: data.prerequisites,
      challenges: data.challenges,
      motivations: data.motivations,
      industryContext: data.industryContext,
      typicalBackground: data.typicalBackground,
    });
    setShowCreateModal(false);
  };

  const handleUpdate = async (
    templateId: string,
    data: {
      name?: string;
      description?: string;
      role?: string;
      experienceLevel?: ExperienceLevel;
      learningGoals?: string[];
      prerequisites?: string[];
      challenges?: string[];
      motivations?: string[];
      industryContext?: string;
      typicalBackground?: string;
    }
  ) => {
    await updateTemplate.mutate(templateId, data);
    setEditingTemplate(null);
    // Refresh selected template if it was the one being edited
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }
  };

  const handleDelete = async (template: TargetAudienceTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await deleteTemplate.mutate(template.id);
      // Clear selection if deleted template was selected
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
      alert('Failed to delete audience template. Please try again.');
    }
  };

  const handleArchive = async (template: TargetAudienceTemplate) => {
    try {
      await archiveTemplate.mutate(template.id);
      // Clear selection if archived template was selected
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
      }
    } catch (err) {
      console.error('Failed to archive template:', err);
      alert('Failed to archive audience template. Please try again.');
    }
  };

  const handleRestore = async (template: TargetAudienceTemplate) => {
    try {
      await restoreTemplate.mutate(template.id);
    } catch (err) {
      console.error('Failed to restore template:', err);
      alert('Failed to restore audience template. Please try again.');
    }
  };

  const handleEdit = (template: TargetAudienceTemplate) => {
    setEditingTemplate(template);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Failed to load target audiences. Please try refreshing the page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* List Section */}
        <div className={selectedTemplate ? 'lg:w-1/2' : 'w-full'}>
          <TargetAudienceList
            templates={templates}
            isLoading={isLoading}
            onSelect={setSelectedTemplate}
            onCreate={() => setShowCreateModal(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
            showArchived={showArchived}
            onToggleArchived={setShowArchived}
            selectedIds={selectedTemplate ? [selectedTemplate.id] : []}
          />
        </div>

        {/* Detail Panel - shown when a template is selected */}
        {selectedTemplate && (
          <div className="lg:w-1/2">
            <TargetAudienceDetailPanel
              template={selectedTemplate}
              onBack={() => setSelectedTemplate(null)}
              onEdit={() => handleEdit(selectedTemplate)}
              onArchive={() => handleArchive(selectedTemplate)}
              onRestore={() => handleRestore(selectedTemplate)}
              onDelete={() => handleDelete(selectedTemplate)}
            />
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTargetAudienceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <EditTargetAudienceModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}
