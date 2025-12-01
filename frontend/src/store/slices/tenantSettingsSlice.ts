import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TenantSettingsState {
  // UI state for API key management
  isApiKeyModalOpen: boolean;
  isTestingApiKey: boolean;
  apiKeyTestStatus: 'idle' | 'testing' | 'success' | 'failed';
  apiKeyTestError: string | null;

  // Usage stats UI
  isUsageExpanded: boolean;
  usageTimeRange: '7d' | '30d' | '90d' | 'all';
}

const initialState: TenantSettingsState = {
  isApiKeyModalOpen: false,
  isTestingApiKey: false,
  apiKeyTestStatus: 'idle',
  apiKeyTestError: null,
  isUsageExpanded: false,
  usageTimeRange: '30d',
};

const tenantSettingsSlice = createSlice({
  name: 'tenantSettings',
  initialState,
  reducers: {
    // API Key modal actions
    openApiKeyModal: (state) => {
      state.isApiKeyModalOpen = true;
      state.apiKeyTestStatus = 'idle';
      state.apiKeyTestError = null;
    },
    closeApiKeyModal: (state) => {
      state.isApiKeyModalOpen = false;
      state.apiKeyTestStatus = 'idle';
      state.apiKeyTestError = null;
    },

    // API Key test actions
    startApiKeyTest: (state) => {
      state.isTestingApiKey = true;
      state.apiKeyTestStatus = 'testing';
      state.apiKeyTestError = null;
    },
    apiKeyTestSuccess: (state) => {
      state.isTestingApiKey = false;
      state.apiKeyTestStatus = 'success';
      state.apiKeyTestError = null;
    },
    apiKeyTestFailed: (state, action: PayloadAction<string>) => {
      state.isTestingApiKey = false;
      state.apiKeyTestStatus = 'failed';
      state.apiKeyTestError = action.payload;
    },
    resetApiKeyTest: (state) => {
      state.isTestingApiKey = false;
      state.apiKeyTestStatus = 'idle';
      state.apiKeyTestError = null;
    },

    // Usage stats UI actions
    toggleUsageExpanded: (state) => {
      state.isUsageExpanded = !state.isUsageExpanded;
    },
    setUsageTimeRange: (state, action: PayloadAction<TenantSettingsState['usageTimeRange']>) => {
      state.usageTimeRange = action.payload;
    },
  },
});

export const {
  openApiKeyModal,
  closeApiKeyModal,
  startApiKeyTest,
  apiKeyTestSuccess,
  apiKeyTestFailed,
  resetApiKeyTest,
  toggleUsageExpanded,
  setUsageTimeRange,
} = tenantSettingsSlice.actions;

export default tenantSettingsSlice.reducer;
