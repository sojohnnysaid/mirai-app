import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Course Editor UI State
// ============================================================================
// This store holds ONLY ephemeral UI state for the course editor.
//
// Architecture:
// - Server Data → Connect-Query (courses, personas, blocks - everything persisted)
// - Wizard Flow → XState (steps, selections, generation states)
// - UI State → Zustand (this store - activeBlockId, save state, modals)

interface CourseEditorUIState {
  // Editor UI state
  activeBlockId: string | null;

  // Save state tracking
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: number | null;
}

interface CourseEditorUIActions {
  // Editor UI actions
  setActiveBlockId: (id: string | null) => void;

  // Save state actions
  markDirty: () => void;
  markClean: () => void;
  setSaving: (saving: boolean) => void;

  // Reset
  reset: () => void;
}

type CourseEditorUIStore = CourseEditorUIState & CourseEditorUIActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: CourseEditorUIState = {
  activeBlockId: null,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
};

// ============================================================================
// Store
// ============================================================================

export const useCourseEditorStore = create<CourseEditorUIStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Editor UI actions
      setActiveBlockId: (id) => set({ activeBlockId: id }),

      // Save state actions
      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false, lastSavedAt: Date.now() }),
      setSaving: (saving) => set({ isSaving: saving }),

      // Reset
      reset: () => set(initialState),
    }),
    { name: 'course-editor-ui' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useActiveBlockId = () => useCourseEditorStore((s) => s.activeBlockId);
export const useIsDirty = () => useCourseEditorStore((s) => s.isDirty);
export const useIsSaving = () => useCourseEditorStore((s) => s.isSaving);
