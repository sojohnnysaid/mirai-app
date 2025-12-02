import { createMachine, assign } from 'xstate';
import { createAuthError, type AuthError } from './shared/types';

// ============================================================
// Types
// ============================================================

export interface CourseBuilderContext {
  // Step 1: Course basics
  courseId: string | null;
  title: string;
  desiredOutcome: string;

  // Step 2: SME selection
  selectedSmeIds: string[];

  // Step 3: Target audience selection
  selectedAudienceIds: string[];

  // Generation state
  outlineJobId: string | null;
  lessonJobId: string | null;

  // UI state
  currentStep: number;
  error: AuthError | null;
}

export type CourseBuilderEvent =
  // Navigation
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'GO_TO_STEP'; step: number }
  // Step 1: Course basics
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_DESIRED_OUTCOME'; outcome: string }
  | { type: 'COURSE_CREATED'; courseId: string }
  // Step 2: SME selection
  | { type: 'TOGGLE_SME'; smeId: string }
  | { type: 'SET_SMES'; smeIds: string[] }
  // Step 3: Target audience selection
  | { type: 'TOGGLE_AUDIENCE'; audienceId: string }
  | { type: 'SET_AUDIENCES'; audienceIds: string[] }
  // Step 4: Generation
  | { type: 'START_GENERATION' }
  | { type: 'OUTLINE_JOB_STARTED'; jobId: string }
  | { type: 'OUTLINE_READY' }
  | { type: 'OUTLINE_APPROVED' }
  | { type: 'OUTLINE_REJECTED' }
  | { type: 'LESSON_JOB_STARTED'; jobId: string }
  | { type: 'GENERATION_COMPLETE' }
  // Common
  | { type: 'ERROR'; error: string }
  | { type: 'DISMISS_ERROR' }
  | { type: 'RESET' };

// ============================================================
// Initial Context
// ============================================================

const initialContext: CourseBuilderContext = {
  courseId: null,
  title: '',
  desiredOutcome: '',
  selectedSmeIds: [],
  selectedAudienceIds: [],
  outlineJobId: null,
  lessonJobId: null,
  currentStep: 1,
  error: null,
};

// ============================================================
// Guards
// ============================================================

const canProceedFromStep1 = ({ context }: { context: CourseBuilderContext }) =>
  context.title.trim().length > 0 && context.desiredOutcome.trim().length > 0;

const canProceedFromStep2 = ({ context }: { context: CourseBuilderContext }) =>
  context.selectedSmeIds.length > 0;

const canProceedFromStep3 = ({ context }: { context: CourseBuilderContext }) =>
  context.selectedAudienceIds.length > 0;

const canStartGeneration = ({ context }: { context: CourseBuilderContext }) =>
  context.courseId !== null &&
  context.selectedSmeIds.length > 0 &&
  context.selectedAudienceIds.length > 0 &&
  context.desiredOutcome.trim().length > 0;

// ============================================================
// Machine Definition
// ============================================================

export const courseBuilderMachine = createMachine({
  id: 'courseBuilder',
  initial: 'courseBasics',
  context: initialContext,
  types: {} as {
    context: CourseBuilderContext;
    events: CourseBuilderEvent;
  },
  states: {
    // --------------------------------------------------------
    // Step 1: Course Basics
    // --------------------------------------------------------
    courseBasics: {
      entry: assign({ currentStep: 1 }),
      on: {
        SET_TITLE: {
          actions: assign({
            title: ({ event }) => event.title,
          }),
        },
        SET_DESIRED_OUTCOME: {
          actions: assign({
            desiredOutcome: ({ event }) => event.outcome,
          }),
        },
        COURSE_CREATED: {
          actions: assign({
            courseId: ({ event }) => event.courseId,
          }),
        },
        NEXT: {
          target: 'smeSelection',
          guard: canProceedFromStep1,
        },
        GO_TO_STEP: [
          { target: 'smeSelection', guard: ({ event }) => event.step === 2 },
          { target: 'audienceSelection', guard: ({ event }) => event.step === 3 },
          { target: 'reviewGenerate', guard: ({ event }) => event.step === 4 },
          { target: 'outlineReview', guard: ({ event }) => event.step === 5 },
          { target: 'editor', guard: ({ event }) => event.step === 6 },
          { target: 'preview', guard: ({ event }) => event.step === 7 },
        ],
      },
    },

    // --------------------------------------------------------
    // Step 2: SME Selection
    // --------------------------------------------------------
    smeSelection: {
      entry: assign({ currentStep: 2 }),
      on: {
        TOGGLE_SME: {
          actions: assign({
            selectedSmeIds: ({ context, event }) => {
              const exists = context.selectedSmeIds.includes(event.smeId);
              if (exists) {
                return context.selectedSmeIds.filter((id) => id !== event.smeId);
              }
              return [...context.selectedSmeIds, event.smeId];
            },
          }),
        },
        SET_SMES: {
          actions: assign({
            selectedSmeIds: ({ event }) => event.smeIds,
          }),
        },
        NEXT: {
          target: 'audienceSelection',
          guard: canProceedFromStep2,
        },
        PREVIOUS: 'courseBasics',
        GO_TO_STEP: [
          { target: 'courseBasics', guard: ({ event }) => event.step === 1 },
          { target: 'audienceSelection', guard: ({ event }) => event.step === 3 },
          { target: 'reviewGenerate', guard: ({ event }) => event.step === 4 },
        ],
      },
    },

    // --------------------------------------------------------
    // Step 3: Target Audience Selection
    // --------------------------------------------------------
    audienceSelection: {
      entry: assign({ currentStep: 3 }),
      on: {
        TOGGLE_AUDIENCE: {
          actions: assign({
            selectedAudienceIds: ({ context, event }) => {
              const exists = context.selectedAudienceIds.includes(event.audienceId);
              if (exists) {
                return context.selectedAudienceIds.filter((id) => id !== event.audienceId);
              }
              return [...context.selectedAudienceIds, event.audienceId];
            },
          }),
        },
        SET_AUDIENCES: {
          actions: assign({
            selectedAudienceIds: ({ event }) => event.audienceIds,
          }),
        },
        NEXT: {
          target: 'reviewGenerate',
          guard: canProceedFromStep3,
        },
        PREVIOUS: 'smeSelection',
        GO_TO_STEP: [
          { target: 'courseBasics', guard: ({ event }) => event.step === 1 },
          { target: 'smeSelection', guard: ({ event }) => event.step === 2 },
          { target: 'reviewGenerate', guard: ({ event }) => event.step === 4 },
        ],
      },
    },

    // --------------------------------------------------------
    // Step 4: Review & Generate
    // --------------------------------------------------------
    reviewGenerate: {
      entry: assign({ currentStep: 4 }),
      on: {
        START_GENERATION: {
          target: 'generatingOutline',
          guard: canStartGeneration,
        },
        PREVIOUS: 'audienceSelection',
        GO_TO_STEP: [
          { target: 'courseBasics', guard: ({ event }) => event.step === 1 },
          { target: 'smeSelection', guard: ({ event }) => event.step === 2 },
          { target: 'audienceSelection', guard: ({ event }) => event.step === 3 },
        ],
      },
    },

    // --------------------------------------------------------
    // Generating Outline
    // --------------------------------------------------------
    generatingOutline: {
      entry: assign({ currentStep: 4 }),
      on: {
        OUTLINE_JOB_STARTED: {
          actions: assign({
            outlineJobId: ({ event }) => event.jobId,
          }),
        },
        OUTLINE_READY: 'outlineReview',
        ERROR: {
          target: 'reviewGenerate',
          actions: assign({
            error: ({ event }) => createAuthError('NETWORK_ERROR', event.error, true),
          }),
        },
      },
    },

    // --------------------------------------------------------
    // Step 5: Outline Review
    // --------------------------------------------------------
    outlineReview: {
      entry: assign({ currentStep: 5 }),
      on: {
        OUTLINE_APPROVED: 'generatingLessons',
        OUTLINE_REJECTED: 'reviewGenerate',
        OUTLINE_JOB_STARTED: {
          target: 'generatingOutline',
          actions: assign({
            outlineJobId: ({ event }) => event.jobId,
          }),
        },
        PREVIOUS: 'reviewGenerate',
      },
    },

    // --------------------------------------------------------
    // Generating Lessons
    // --------------------------------------------------------
    generatingLessons: {
      entry: assign({ currentStep: 5 }),
      on: {
        LESSON_JOB_STARTED: {
          actions: assign({
            lessonJobId: ({ event }) => event.jobId,
          }),
        },
        GENERATION_COMPLETE: 'editor',
        ERROR: {
          target: 'outlineReview',
          actions: assign({
            error: ({ event }) => createAuthError('NETWORK_ERROR', event.error, true),
          }),
        },
      },
    },

    // --------------------------------------------------------
    // Step 6: Editor
    // --------------------------------------------------------
    editor: {
      entry: assign({ currentStep: 6 }),
      on: {
        NEXT: 'preview',
        GO_TO_STEP: [
          { target: 'preview', guard: ({ event }) => event.step === 7 },
        ],
      },
    },

    // --------------------------------------------------------
    // Step 7: Preview
    // --------------------------------------------------------
    preview: {
      entry: assign({ currentStep: 7 }),
      on: {
        PREVIOUS: 'editor',
        GO_TO_STEP: [
          { target: 'editor', guard: ({ event }) => event.step === 6 },
        ],
      },
    },
  },
  on: {
    DISMISS_ERROR: {
      actions: assign({ error: null }),
    },
    RESET: {
      target: '.courseBasics',
      actions: assign(initialContext),
    },
  },
});

// ============================================================
// Step Labels
// ============================================================

export const STEP_LABELS = [
  { step: 1, label: 'Course Info', description: 'Define your course' },
  { step: 2, label: 'Knowledge Sources', description: 'Select SMEs' },
  { step: 3, label: 'Target Audience', description: 'Who is this for?' },
  { step: 4, label: 'Review', description: 'Review & generate' },
  { step: 5, label: 'Outline', description: 'Review outline' },
  { step: 6, label: 'Edit', description: 'Edit content' },
  { step: 7, label: 'Preview', description: 'Preview & export' },
];

export function getStepLabel(step: number): string {
  return STEP_LABELS.find((s) => s.step === step)?.label || '';
}

export function getStepDescription(step: number): string {
  return STEP_LABELS.find((s) => s.step === step)?.description || '';
}
