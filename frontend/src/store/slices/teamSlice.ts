import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TeamState {
  // Selection state
  selectedTeamId: string | null;

  // UI state
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isAddMemberModalOpen: boolean;

  // Detail view state
  isDetailViewOpen: boolean;
}

const initialState: TeamState = {
  selectedTeamId: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isAddMemberModalOpen: false,
  isDetailViewOpen: false,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    // Selection actions
    selectTeam: (state, action: PayloadAction<string | null>) => {
      state.selectedTeamId = action.payload;
    },
    clearSelection: (state) => {
      state.selectedTeamId = null;
      state.isDetailViewOpen = false;
    },

    // Detail view actions
    openDetailView: (state, action: PayloadAction<string>) => {
      state.selectedTeamId = action.payload;
      state.isDetailViewOpen = true;
    },
    closeDetailView: (state) => {
      state.isDetailViewOpen = false;
    },

    // Modal actions
    openCreateModal: (state) => {
      state.isCreateModalOpen = true;
    },
    closeCreateModal: (state) => {
      state.isCreateModalOpen = false;
    },
    openEditModal: (state) => {
      state.isEditModalOpen = true;
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
    },
    openAddMemberModal: (state) => {
      state.isAddMemberModalOpen = true;
    },
    closeAddMemberModal: (state) => {
      state.isAddMemberModalOpen = false;
    },

    // Reset state
    resetTeamState: () => initialState,
  },
});

export const {
  selectTeam,
  clearSelection,
  openDetailView,
  closeDetailView,
  openCreateModal,
  closeCreateModal,
  openEditModal,
  closeEditModal,
  openAddMemberModal,
  closeAddMemberModal,
  resetTeamState,
} = teamSlice.actions;

export default teamSlice.reducer;
