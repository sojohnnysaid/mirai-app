import { createMachine, assign, fromPromise } from 'xstate';
import type { SubjectMatterExpert, SMEScope, SMEStatus } from '@/gen/mirai/v1/sme_pb';
import type { GenerationJob } from '@/gen/mirai/v1/ai_generation_pb';
import { LMS_TELEMETRY, emitTelemetry, smeTelemetry } from './shared/telemetry';
import { NetworkError, createAuthError, type AuthError } from './shared/types';

// ============================================================
// Types
// ============================================================

export interface SMEContext {
  // SME data
  selectedSME: SubjectMatterExpert | null;
  smeList: SubjectMatterExpert[];

  // Form data for creating/editing SME
  formData: {
    name: string;
    description: string;
    domain: string;
    scope: SMEScope;
    teamIds: string[];
  };

  // Ingestion tracking
  ingestionJob: GenerationJob | null;
  ingestionProgress: number;

  // State tracking
  error: AuthError | null;
  flowStartedAt: number | null;
}

export type SMEEvent =
  // Navigation
  | { type: 'SELECT_SME'; sme: SubjectMatterExpert }
  | { type: 'DESELECT_SME' }
  | { type: 'BACK_TO_LIST' }
  // Form actions
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_DESCRIPTION'; description: string }
  | { type: 'SET_DOMAIN'; domain: string }
  | { type: 'SET_SCOPE'; scope: SMEScope }
  | { type: 'SET_TEAM_IDS'; teamIds: string[] }
  | { type: 'RESET_FORM' }
  // CRUD actions
  | { type: 'START_CREATE' }
  | { type: 'SUBMIT_CREATE' }
  | { type: 'CANCEL_CREATE' }
  | { type: 'SUBMIT_UPDATE' }
  | { type: 'DELETE' }
  // Ingestion
  | { type: 'START_INGESTION' }
  | { type: 'POLL_INGESTION' }
  | { type: 'CANCEL_INGESTION' }
  // Common
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'DISMISS_ERROR' };

// API Response types (these will come from connect-query hooks in actual usage)
interface CreateSMEResponse {
  sme: SubjectMatterExpert;
}

interface UpdateSMEResponse {
  sme: SubjectMatterExpert;
}

interface GetKnowledgeResponse {
  sme: SubjectMatterExpert;
  chunks: unknown[];
}

interface StartIngestionResponse {
  job: GenerationJob;
}

interface GetJobResponse {
  job: GenerationJob;
}

// ============================================================
// Initial Context
// ============================================================

const initialFormData = {
  name: '',
  description: '',
  domain: '',
  scope: 0 as SMEScope, // SME_SCOPE_UNSPECIFIED
  teamIds: [] as string[],
};

const initialContext: SMEContext = {
  selectedSME: null,
  smeList: [],
  formData: { ...initialFormData },
  ingestionJob: null,
  ingestionProgress: 0,
  error: null,
  flowStartedAt: null,
};

// ============================================================
// Actor Definitions
// ============================================================

/**
 * Create SME actor - to be invoked with actual API call
 */
export const createSMEActor = fromPromise<CreateSMEResponse, SMEContext['formData']>(
  async ({ input }) => {
    // This will be replaced with actual API call via useMutation
    throw new NetworkError('createSMEActor must be provided by the component');
  }
);

/**
 * Update SME actor - to be invoked with actual API call
 */
export const updateSMEActor = fromPromise<UpdateSMEResponse, { smeId: string; formData: SMEContext['formData'] }>(
  async ({ input }) => {
    throw new NetworkError('updateSMEActor must be provided by the component');
  }
);

/**
 * Delete SME actor
 */
export const deleteSMEActor = fromPromise<void, { smeId: string }>(
  async ({ input }) => {
    throw new NetworkError('deleteSMEActor must be provided by the component');
  }
);

/**
 * Get knowledge actor - loads SME details with knowledge chunks
 */
export const getKnowledgeActor = fromPromise<GetKnowledgeResponse, { smeId: string }>(
  async ({ input }) => {
    throw new NetworkError('getKnowledgeActor must be provided by the component');
  }
);

/**
 * Start ingestion actor
 */
export const startIngestionActor = fromPromise<StartIngestionResponse, { smeId: string }>(
  async ({ input }) => {
    throw new NetworkError('startIngestionActor must be provided by the component');
  }
);

/**
 * Poll ingestion job status actor
 */
export const pollIngestionActor = fromPromise<GetJobResponse, { jobId: string }>(
  async ({ input }) => {
    throw new NetworkError('pollIngestionActor must be provided by the component');
  }
);

// ============================================================
// Machine Definition
// ============================================================

export const smeMachine = createMachine({
  id: 'sme',
  initial: 'idle',
  context: initialContext,
  types: {} as {
    context: SMEContext;
    events: SMEEvent;
  },
  states: {
    // --------------------------------------------------------
    // Idle - viewing SME list
    // --------------------------------------------------------
    idle: {
      on: {
        SELECT_SME: {
          target: 'loading',
          actions: assign({
            selectedSME: ({ event }) => event.sme,
            flowStartedAt: () => Date.now(),
          }),
        },
        START_CREATE: {
          target: 'creating',
          actions: assign({
            formData: () => ({ ...initialFormData }),
            flowStartedAt: () => Date.now(),
          }),
        },
      },
    },

    // --------------------------------------------------------
    // Creating - creating a new SME
    // --------------------------------------------------------
    creating: {
      initial: 'form',
      states: {
        form: {
          on: {
            SET_NAME: {
              actions: assign({
                formData: ({ context, event }) => ({ ...context.formData, name: event.name }),
              }),
            },
            SET_DESCRIPTION: {
              actions: assign({
                formData: ({ context, event }) => ({ ...context.formData, description: event.description }),
              }),
            },
            SET_DOMAIN: {
              actions: assign({
                formData: ({ context, event }) => ({ ...context.formData, domain: event.domain }),
              }),
            },
            SET_SCOPE: {
              actions: assign({
                formData: ({ context, event }) => ({ ...context.formData, scope: event.scope }),
              }),
            },
            SET_TEAM_IDS: {
              actions: assign({
                formData: ({ context, event }) => ({ ...context.formData, teamIds: event.teamIds }),
              }),
            },
            SUBMIT_CREATE: {
              target: 'submitting',
              guard: ({ context }) => context.formData.name.trim().length > 0,
            },
            CANCEL_CREATE: '#sme.idle',
          },
        },
        submitting: {
          invoke: {
            id: 'createSME',
            src: createSMEActor,
            input: ({ context }) => context.formData,
            onDone: {
              target: '#sme.loaded',
              actions: [
                assign({
                  selectedSME: ({ event }) => event.output.sme,
                  error: null,
                }),
                smeTelemetry.created,
              ],
            },
            onError: {
              target: 'form',
              actions: assign({
                error: ({ event }) =>
                  createAuthError(
                    'NETWORK_ERROR',
                    event.error instanceof Error ? event.error.message : 'Failed to create SME',
                    true
                  ),
              }),
            },
          },
        },
      },
    },

    // --------------------------------------------------------
    // Loading - loading SME details
    // --------------------------------------------------------
    loading: {
      invoke: {
        id: 'loadKnowledge',
        src: getKnowledgeActor,
        input: ({ context }) => ({ smeId: context.selectedSME!.id }),
        onDone: {
          target: 'loaded',
          actions: [
            assign({
              selectedSME: ({ event }) => event.output.sme,
              error: null,
            }),
            smeTelemetry.selected,
          ],
        },
        onError: {
          target: 'idle',
          actions: assign({
            error: ({ event }) =>
              createAuthError(
                'NETWORK_ERROR',
                event.error instanceof Error ? event.error.message : 'Failed to load SME',
                true
              ),
            selectedSME: null,
          }),
        },
      },
    },

    // --------------------------------------------------------
    // Loaded - viewing SME details
    // --------------------------------------------------------
    loaded: {
      initial: 'viewing',
      states: {
        viewing: {
          on: {
            BACK_TO_LIST: '#sme.idle',
            START_INGESTION: 'startingIngestion',
            DELETE: 'deleting',
          },
        },
        startingIngestion: {
          entry: smeTelemetry.ingestionStarted,
          invoke: {
            id: 'startIngestion',
            src: startIngestionActor,
            input: ({ context }) => ({ smeId: context.selectedSME!.id }),
            onDone: {
              target: '#sme.ingesting',
              actions: assign({
                ingestionJob: ({ event }) => event.output.job,
                ingestionProgress: 0,
                error: null,
              }),
            },
            onError: {
              target: 'viewing',
              actions: [
                assign({
                  error: ({ event }) =>
                    createAuthError(
                      'NETWORK_ERROR',
                      event.error instanceof Error ? event.error.message : 'Failed to start ingestion',
                      true
                    ),
                }),
                smeTelemetry.ingestionFailed,
              ],
            },
          },
        },
        deleting: {
          invoke: {
            id: 'deleteSME',
            src: deleteSMEActor,
            input: ({ context }) => ({ smeId: context.selectedSME!.id }),
            onDone: {
              target: '#sme.idle',
              actions: assign({
                selectedSME: null,
                error: null,
              }),
            },
            onError: {
              target: 'viewing',
              actions: assign({
                error: ({ event }) =>
                  createAuthError(
                    'NETWORK_ERROR',
                    event.error instanceof Error ? event.error.message : 'Failed to delete SME',
                    true
                  ),
              }),
            },
          },
        },
      },
    },

    // --------------------------------------------------------
    // Ingesting - polling for ingestion job completion
    // --------------------------------------------------------
    ingesting: {
      initial: 'polling',
      states: {
        polling: {
          invoke: {
            id: 'pollIngestion',
            src: pollIngestionActor,
            input: ({ context }) => ({ jobId: context.ingestionJob!.id }),
            onDone: [
              {
                // Job completed successfully
                target: '#sme.loaded',
                guard: ({ event }) => event.output.job.status === 3, // COMPLETED
                actions: [
                  assign({
                    ingestionJob: ({ event }) => event.output.job,
                    ingestionProgress: 100,
                    error: null,
                  }),
                  smeTelemetry.ingestionCompleted,
                ],
              },
              {
                // Job failed
                target: '#sme.loaded',
                guard: ({ event }) => event.output.job.status === 4, // FAILED
                actions: [
                  assign({
                    ingestionJob: ({ event }) => event.output.job,
                    error: ({ event }) =>
                      createAuthError(
                        'NETWORK_ERROR',
                        event.output.job.errorMessage || 'Ingestion failed',
                        true
                      ),
                  }),
                  smeTelemetry.ingestionFailed,
                ],
              },
              {
                // Job still in progress - continue polling
                target: 'waiting',
                actions: assign({
                  ingestionJob: ({ event }) => event.output.job,
                  ingestionProgress: ({ event }) => event.output.job.progressPercent,
                }),
              },
            ],
            onError: {
              target: '#sme.loaded',
              actions: [
                assign({
                  error: ({ event }) =>
                    createAuthError(
                      'NETWORK_ERROR',
                      event.error instanceof Error ? event.error.message : 'Failed to poll ingestion status',
                      true
                    ),
                }),
                smeTelemetry.ingestionFailed,
              ],
            },
          },
        },
        waiting: {
          after: {
            2000: 'polling', // Poll every 2 seconds
          },
          on: {
            CANCEL_INGESTION: '#sme.loaded',
          },
        },
      },
    },
  },
});

// ============================================================
// Helper functions
// ============================================================

/**
 * Check if the machine is in a loading/processing state
 */
export function isProcessing(state: { value: unknown }): boolean {
  const value = state.value;
  if (typeof value === 'string') {
    return value === 'loading' || value === 'ingesting';
  }
  if (typeof value === 'object' && value !== null) {
    return 'submitting' in value || 'deleting' in value || 'startingIngestion' in value;
  }
  return false;
}

/**
 * Get current SME status label
 */
export function getSMEStatusLabel(status: SMEStatus): string {
  const labels: Record<number, string> = {
    0: 'Unknown',
    1: 'Draft',
    2: 'Ingesting',
    3: 'Active',
    4: 'Archived',
  };
  return labels[status] || 'Unknown';
}
