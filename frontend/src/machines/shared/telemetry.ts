/**
 * Telemetry for State Machines
 *
 * Centralized telemetry event emission for all authentication
 * and organization state machines.
 *
 * Contract: All flows emit telemetry events at key transitions.
 */

// =============================================================================
// Telemetry Event Names
// =============================================================================

/**
 * Standard telemetry events emitted by auth/org machines
 */
export const AUTH_TELEMETRY = {
  // Login events
  LOGIN_STARTED: 'auth.login.started',
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',

  // Logout events
  LOGOUT_STARTED: 'auth.logout.started',
  LOGOUT_COMPLETED: 'auth.logout.completed',

  // Registration events
  REGISTRATION_STARTED: 'auth.registration.started',
  REGISTRATION_SUCCESS: 'auth.registration.success',
  REGISTRATION_FAILED: 'auth.registration.failed',

  // Invitation events
  INVITATION_VIEWED: 'auth.invitation.viewed',
  INVITATION_ACCEPTED: 'auth.invitation.accepted',
  INVITATION_FAILED: 'auth.invitation.failed',
  INVITATION_CREATED: 'org.invitation.created',
  INVITATION_REVOKED: 'org.invitation.revoked',

  // Session events
  SESSION_VALIDATED: 'auth.session.validated',
  SESSION_EXPIRED: 'auth.session.expired',
  SESSION_REFRESHED: 'auth.session.refreshed',

  // Flow events
  FLOW_STARTED: 'auth.flow.started',
  FLOW_COMPLETED: 'auth.flow.completed',
  FLOW_FAILED: 'auth.flow.failed',
  FLOW_EXPIRED: 'auth.flow.expired',
} as const;

/**
 * LMS/AI generation telemetry events
 */
export const LMS_TELEMETRY = {
  // SME events
  SME_CREATED: 'lms.sme.created',
  SME_SELECTED: 'lms.sme.selected',
  SME_INGESTION_STARTED: 'lms.sme.ingestion_started',
  SME_INGESTION_COMPLETED: 'lms.sme.ingestion_completed',
  SME_INGESTION_FAILED: 'lms.sme.ingestion_failed',

  // Course generation events
  COURSE_GENERATION_STARTED: 'lms.course.generation_started',
  COURSE_OUTLINE_GENERATED: 'lms.course.outline_generated',
  COURSE_OUTLINE_APPROVED: 'lms.course.outline_approved',
  COURSE_OUTLINE_REJECTED: 'lms.course.outline_rejected',
  COURSE_LESSONS_GENERATING: 'lms.course.lessons_generating',
  COURSE_GENERATION_COMPLETED: 'lms.course.generation_completed',
  COURSE_GENERATION_FAILED: 'lms.course.generation_failed',
  GENERATION_BACKGROUNDED: 'lms.course.generation_backgrounded',

  // Component editing events
  COMPONENT_EDIT_STARTED: 'lms.component.edit_started',
  COMPONENT_REGENERATING: 'lms.component.regenerating',
  COMPONENT_SAVED: 'lms.component.saved',
  COMPONENT_EDIT_FAILED: 'lms.component.edit_failed',
} as const;

export type TelemetryEventName =
  | (typeof AUTH_TELEMETRY)[keyof typeof AUTH_TELEMETRY]
  | (typeof LMS_TELEMETRY)[keyof typeof LMS_TELEMETRY];

// =============================================================================
// Telemetry Context
// =============================================================================

/**
 * Common context included in all telemetry events
 */
export interface TelemetryContext {
  /** Machine that emitted the event */
  machineId: string;

  /** Current state when event was emitted */
  state?: string;

  /** Duration since flow started (ms) */
  duration?: number;

  /** Error code if applicable */
  errorCode?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Telemetry Emitter
// =============================================================================

/**
 * Emit a telemetry event
 *
 * Currently logs to console. In production, this would send
 * to an analytics service (e.g., Amplitude, Mixpanel, PostHog).
 */
export function emitTelemetry(eventName: TelemetryEventName, context: TelemetryContext): void {
  const event = {
    event: eventName,
    timestamp: Date.now(),
    ...context,
  };

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Telemetry]', eventName, context);
  }

  // TODO: Send to analytics service in production
  // analytics.track(eventName, event);
}

// =============================================================================
// Telemetry Helpers
// =============================================================================

/**
 * Calculate duration from flow start time
 */
export function calculateDuration(flowStartedAt: number | null): number | undefined {
  if (!flowStartedAt) return undefined;
  return Date.now() - flowStartedAt;
}

/**
 * Create a telemetry action for XState entry/exit
 *
 * @example
 * entry: createTelemetryAction('login', AUTH_TELEMETRY.LOGIN_STARTED)
 */
export function createTelemetryAction(
  machineId: string,
  eventName: TelemetryEventName,
  getMetadata?: (context: unknown) => Record<string, unknown>
) {
  return ({ context }: { context: { flowStartedAt?: number | null } }) => {
    emitTelemetry(eventName, {
      machineId,
      duration: calculateDuration(context.flowStartedAt ?? null),
      metadata: getMetadata?.(context),
    });
  };
}

/**
 * Create success telemetry action
 */
export function createSuccessTelemetry(machineId: string, eventName: TelemetryEventName) {
  return createTelemetryAction(machineId, eventName);
}

/**
 * Create failure telemetry action with error context
 */
export function createFailureTelemetry(machineId: string, eventName: TelemetryEventName) {
  return ({
    context,
  }: {
    context: { flowStartedAt?: number | null; error?: { code: string; message: string } | null };
  }) => {
    emitTelemetry(eventName, {
      machineId,
      duration: calculateDuration(context.flowStartedAt ?? null),
      errorCode: context.error?.code,
      metadata: {
        errorMessage: context.error?.message,
      },
    });
  };
}

// =============================================================================
// Pre-built Telemetry Actions
// =============================================================================

/**
 * Login telemetry actions
 */
export const loginTelemetry = {
  started: createTelemetryAction('login', AUTH_TELEMETRY.LOGIN_STARTED),
  success: createSuccessTelemetry('login', AUTH_TELEMETRY.LOGIN_SUCCESS),
  failed: createFailureTelemetry('login', AUTH_TELEMETRY.LOGIN_FAILED),
};

/**
 * Logout telemetry actions
 */
export const logoutTelemetry = {
  started: createTelemetryAction('logout', AUTH_TELEMETRY.LOGOUT_STARTED),
  completed: createSuccessTelemetry('logout', AUTH_TELEMETRY.LOGOUT_COMPLETED),
};

/**
 * Registration telemetry actions
 */
export const registrationTelemetry = {
  started: createTelemetryAction('registration', AUTH_TELEMETRY.REGISTRATION_STARTED),
  success: createSuccessTelemetry('registration', AUTH_TELEMETRY.REGISTRATION_SUCCESS),
  failed: createFailureTelemetry('registration', AUTH_TELEMETRY.REGISTRATION_FAILED),
};

/**
 * Invitation telemetry actions
 */
export const invitationTelemetry = {
  viewed: createTelemetryAction('invitation', AUTH_TELEMETRY.INVITATION_VIEWED),
  accepted: createSuccessTelemetry('invitation', AUTH_TELEMETRY.INVITATION_ACCEPTED),
  failed: createFailureTelemetry('invitation', AUTH_TELEMETRY.INVITATION_FAILED),
};

// =============================================================================
// LMS Telemetry Actions
// =============================================================================

/**
 * SME telemetry actions
 */
export const smeTelemetry = {
  created: createTelemetryAction('sme', LMS_TELEMETRY.SME_CREATED),
  selected: createTelemetryAction('sme', LMS_TELEMETRY.SME_SELECTED),
  ingestionStarted: createTelemetryAction('sme', LMS_TELEMETRY.SME_INGESTION_STARTED),
  ingestionCompleted: createSuccessTelemetry('sme', LMS_TELEMETRY.SME_INGESTION_COMPLETED),
  ingestionFailed: createFailureTelemetry('sme', LMS_TELEMETRY.SME_INGESTION_FAILED),
};

/**
 * Course generation telemetry actions
 */
export const courseGenerationTelemetry = {
  started: createTelemetryAction('courseGeneration', LMS_TELEMETRY.COURSE_GENERATION_STARTED),
  outlineGenerated: createTelemetryAction('courseGeneration', LMS_TELEMETRY.COURSE_OUTLINE_GENERATED),
  outlineApproved: createTelemetryAction('courseGeneration', LMS_TELEMETRY.COURSE_OUTLINE_APPROVED),
  outlineRejected: createTelemetryAction('courseGeneration', LMS_TELEMETRY.COURSE_OUTLINE_REJECTED),
  lessonsGenerating: createTelemetryAction('courseGeneration', LMS_TELEMETRY.COURSE_LESSONS_GENERATING),
  completed: createSuccessTelemetry('courseGeneration', LMS_TELEMETRY.COURSE_GENERATION_COMPLETED),
  failed: createFailureTelemetry('courseGeneration', LMS_TELEMETRY.COURSE_GENERATION_FAILED),
};

/**
 * Component editing telemetry actions
 */
export const componentEditingTelemetry = {
  started: createTelemetryAction('componentEditing', LMS_TELEMETRY.COMPONENT_EDIT_STARTED),
  regenerating: createTelemetryAction('componentEditing', LMS_TELEMETRY.COMPONENT_REGENERATING),
  saved: createSuccessTelemetry('componentEditing', LMS_TELEMETRY.COMPONENT_SAVED),
  failed: createFailureTelemetry('componentEditing', LMS_TELEMETRY.COMPONENT_EDIT_FAILED),
};
