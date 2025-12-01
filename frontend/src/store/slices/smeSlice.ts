import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SMEState {
  // Selection state
  selectedSMEId: string | null;
  selectedTaskId: string | null;

  // UI state
  isCreateModalOpen: boolean;
  isTaskModalOpen: boolean;
  isUploadModalOpen: boolean;

  // Filter/sort preferences
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  filterScope: 'all' | 'global' | 'team';
  filterStatus: 'all' | 'draft' | 'active' | 'archived';
}

const initialState: SMEState = {
  selectedSMEId: null,
  selectedTaskId: null,
  isCreateModalOpen: false,
  isTaskModalOpen: false,
  isUploadModalOpen: false,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  filterScope: 'all',
  filterStatus: 'all',
};

const smeSlice = createSlice({
  name: 'sme',
  initialState,
  reducers: {
    // Selection actions
    selectSME: (state, action: PayloadAction<string | null>) => {
      state.selectedSMEId = action.payload;
      state.selectedTaskId = null; // Reset task selection when SME changes
    },
    selectTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTaskId = action.payload;
    },
    clearSelection: (state) => {
      state.selectedSMEId = null;
      state.selectedTaskId = null;
    },

    // Modal actions
    openCreateModal: (state) => {
      state.isCreateModalOpen = true;
    },
    closeCreateModal: (state) => {
      state.isCreateModalOpen = false;
    },
    openTaskModal: (state) => {
      state.isTaskModalOpen = true;
    },
    closeTaskModal: (state) => {
      state.isTaskModalOpen = false;
    },
    openUploadModal: (state) => {
      state.isUploadModalOpen = true;
    },
    closeUploadModal: (state) => {
      state.isUploadModalOpen = false;
    },

    // Filter/sort actions
    setSortBy: (state, action: PayloadAction<SMEState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<SMEState['sortOrder']>) => {
      state.sortOrder = action.payload;
    },
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    setFilterScope: (state, action: PayloadAction<SMEState['filterScope']>) => {
      state.filterScope = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<SMEState['filterStatus']>) => {
      state.filterStatus = action.payload;
    },
    resetFilters: (state) => {
      state.sortBy = 'createdAt';
      state.sortOrder = 'desc';
      state.filterScope = 'all';
      state.filterStatus = 'all';
    },
  },
});

export const {
  selectSME,
  selectTask,
  clearSelection,
  openCreateModal,
  closeCreateModal,
  openTaskModal,
  closeTaskModal,
  openUploadModal,
  closeUploadModal,
  setSortBy,
  setSortOrder,
  toggleSortOrder,
  setFilterScope,
  setFilterStatus,
  resetFilters,
} = smeSlice.actions;

export default smeSlice.reducer;
