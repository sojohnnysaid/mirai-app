import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
  // UI state
  isPanelOpen: boolean;
  showUnreadOnly: boolean;

  // Local optimistic updates for read status
  locallyReadIds: string[];
}

const initialState: NotificationState = {
  isPanelOpen: false,
  showUnreadOnly: false,
  locallyReadIds: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Panel actions
    openPanel: (state) => {
      state.isPanelOpen = true;
    },
    closePanel: (state) => {
      state.isPanelOpen = false;
    },
    togglePanel: (state) => {
      state.isPanelOpen = !state.isPanelOpen;
    },

    // Filter actions
    setShowUnreadOnly: (state, action: PayloadAction<boolean>) => {
      state.showUnreadOnly = action.payload;
    },
    toggleShowUnreadOnly: (state) => {
      state.showUnreadOnly = !state.showUnreadOnly;
    },

    // Optimistic update actions
    markLocallyRead: (state, action: PayloadAction<string[]>) => {
      state.locallyReadIds = [...new Set([...state.locallyReadIds, ...action.payload])];
    },
    markAllLocallyRead: (state) => {
      // This will be synced with server via hook
    },
    clearLocallyRead: (state) => {
      state.locallyReadIds = [];
    },
  },
});

export const {
  openPanel,
  closePanel,
  togglePanel,
  setShowUnreadOnly,
  toggleShowUnreadOnly,
  markLocallyRead,
  markAllLocallyRead,
  clearLocallyRead,
} = notificationSlice.actions;

export default notificationSlice.reducer;
