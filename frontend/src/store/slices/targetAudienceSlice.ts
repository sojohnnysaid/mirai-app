import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TargetAudienceState {
  // Selection state
  selectedTemplateId: string | null;

  // UI state
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;

  // Filter/sort preferences
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  filterExperienceLevel: 'all' | 'beginner' | 'intermediate' | 'advanced';
}

const initialState: TargetAudienceState = {
  selectedTemplateId: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  filterExperienceLevel: 'all',
};

const targetAudienceSlice = createSlice({
  name: 'targetAudience',
  initialState,
  reducers: {
    // Selection actions
    selectTemplate: (state, action: PayloadAction<string | null>) => {
      state.selectedTemplateId = action.payload;
    },
    clearSelection: (state) => {
      state.selectedTemplateId = null;
    },

    // Modal actions
    openCreateModal: (state) => {
      state.isCreateModalOpen = true;
    },
    closeCreateModal: (state) => {
      state.isCreateModalOpen = false;
    },
    openEditModal: (state, action: PayloadAction<string>) => {
      state.selectedTemplateId = action.payload;
      state.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
    },

    // Filter/sort actions
    setSortBy: (state, action: PayloadAction<TargetAudienceState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<TargetAudienceState['sortOrder']>) => {
      state.sortOrder = action.payload;
    },
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    setFilterExperienceLevel: (state, action: PayloadAction<TargetAudienceState['filterExperienceLevel']>) => {
      state.filterExperienceLevel = action.payload;
    },
    resetFilters: (state) => {
      state.sortBy = 'createdAt';
      state.sortOrder = 'desc';
      state.filterExperienceLevel = 'all';
    },
  },
});

export const {
  selectTemplate,
  clearSelection,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  setSortBy,
  setSortOrder,
  toggleSortOrder,
  setFilterExperienceLevel,
  resetFilters,
} = targetAudienceSlice.actions;

export default targetAudienceSlice.reducer;
