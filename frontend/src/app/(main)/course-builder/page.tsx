'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetCourse } from '@/hooks/useCourses';

// Machine
import { courseBuilderMachine, STEP_LABELS } from '@/machines/courseBuilderMachine';

// Step Components
import {
  CourseBasicsStep,
  SMESelectionStep,
  AudienceSelectionStep,
  ReviewGenerateStep,
} from '@/components/course-builder';
import CourseEditor from '@/components/course/CourseEditor';
import CoursePreview from '@/components/course/CoursePreview';

// AI Generation Components
import { GenerationProgressPanel, OutlineReviewPanel } from '@/components/ai-generation';

// Hooks
import { useCreateCourse, useUpdateCourse } from '@/hooks/useCourses';
import {
  useGenerateCourseOutline,
  useGetCourseOutline,
  useApproveCourseOutline,
  useRejectCourseOutline,
  useUpdateCourseOutline,
  useGenerateAllLessons,
  useListGeneratedLessons,
  useGetJob,
  GenerationJobStatus,
  type OutlineSection,
} from '@/hooks/useAIGeneration';
import { useListTargetAudiences } from '@/hooks/useTargetAudience';

// Content transformation
import { generatedLessonsToCourseContent, toApiFormat } from '@/lib/contentTransform';

// Icons
import { Check } from 'lucide-react';

export default function CourseBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // XState machine drives the wizard flow
  const [state, send] = useMachine(courseBuilderMachine);
  const { context } = state;

  // Connect-Query hook to fetch course data when we have an ID
  const { data: courseData } = useGetCourse(context.courseId || undefined);

  // API Hooks
  const createCourseHook = useCreateCourse();
  const updateCourseHook = useUpdateCourse();
  const generateOutlineHook = useGenerateCourseOutline();
  const getOutlineHook = useGetCourseOutline(context.courseId || undefined);
  const approveOutlineHook = useApproveCourseOutline();
  const rejectOutlineHook = useRejectCourseOutline();
  const updateOutlineHook = useUpdateCourseOutline();
  const generateLessonsHook = useGenerateAllLessons();
  const listLessonsHook = useListGeneratedLessons(context.courseId || undefined);
  const { data: targetAudiences } = useListTargetAudiences();

  // Job polling
  const { data: outlineJob } = useGetJob(context.outlineJobId || undefined);
  const { data: lessonJob } = useGetJob(context.lessonJobId || undefined);

  // Refs to prevent duplicate operations
  const hasInitialized = useRef(false);
  const isCreatingCourse = useRef(false);

  // ============================================================
  // URL Parameter Handling
  // ============================================================
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const courseId = searchParams.get('id');
    const stepParam = searchParams.get('step');

    if (courseId) {
      // Notify XState machine about existing course
      send({ type: 'COURSE_CREATED', courseId });

      // Jump to specific step if provided
      if (stepParam) {
        const step = parseInt(stepParam, 10);
        if (step >= 1 && step <= 7) {
          send({ type: 'GO_TO_STEP', step });
        }
      }
    }
  }, [searchParams, send]);

  // ============================================================
  // Course Creation
  // ============================================================
  const createCourseIfNeeded = useCallback(async () => {
    if (context.courseId || isCreatingCourse.current) return context.courseId;

    isCreatingCourse.current = true;
    try {
      const result = await createCourseHook.mutate({
        settings: {
          title: context.title,
          desiredOutcome: context.desiredOutcome,
          destinationFolder: '',
          categoryTags: [],
          dataSource: 'sme',
        },
      });

      const newCourseId = result.course?.id || '';
      send({ type: 'COURSE_CREATED', courseId: newCourseId });
      // Course data will be loaded via Connect-Query hook when courseId changes

      // Update URL
      router.replace(`/course-builder?id=${newCourseId}`, { scroll: false });

      return newCourseId;
    } finally {
      isCreatingCourse.current = false;
    }
  }, [context.courseId, context.title, context.desiredOutcome, createCourseHook, send, router]);

  // ============================================================
  // Generation Flow
  // ============================================================
  const handleStartGeneration = useCallback(async () => {
    // Ensure course exists
    let courseId = context.courseId;
    if (!courseId) {
      courseId = await createCourseIfNeeded();
      if (!courseId) return;
    }

    // Convert target audiences to personas and update course
    const selectedAudiences = targetAudiences?.filter((a) =>
      context.selectedAudienceIds.includes(a.id)
    ) || [];

    const personas = selectedAudiences.map((audience) => ({
      id: `persona-${audience.id}`,
      name: audience.name,
      role: audience.role || audience.name,
      kpis: audience.learningGoals?.join(', ') || '',
      responsibilities: audience.typicalBackground || '',
      challenges: audience.challenges?.join(', ') || '',
    }));

    // Update course with personas
    await updateCourseHook.mutate(courseId, {
      settings: {
        title: context.title,
        desiredOutcome: context.desiredOutcome,
      },
      personas,
    });

    // Start outline generation
    send({ type: 'START_GENERATION' });

    try {
      const result = await generateOutlineHook.mutate({
        courseId,
        smeIds: context.selectedSmeIds,
        targetAudienceIds: context.selectedAudienceIds,
        desiredOutcome: context.desiredOutcome,
      });

      if (result.job) {
        send({ type: 'OUTLINE_JOB_STARTED', jobId: result.job.id });
      }
    } catch (error) {
      send({ type: 'ERROR', error: error instanceof Error ? error.message : 'Failed to start generation' });
    }
  }, [context, createCourseIfNeeded, targetAudiences, updateCourseHook, generateOutlineHook, send]);

  // Watch for outline job completion
  useEffect(() => {
    if (!outlineJob || state.value !== 'generatingOutline') return;

    if (outlineJob.status === GenerationJobStatus.COMPLETED) {
      // Refetch outline data before transitioning to ensure it's available
      getOutlineHook.refetch().then(() => {
        send({ type: 'OUTLINE_READY' });
      });
    } else if (outlineJob.status === GenerationJobStatus.FAILED) {
      send({ type: 'ERROR', error: outlineJob.errorMessage || 'Outline generation failed' });
    }
  }, [outlineJob, state.value, send, getOutlineHook]);

  // Handle outline approval
  const handleApproveOutline = useCallback(async () => {
    if (!context.courseId || !getOutlineHook.data) return;

    try {
      await approveOutlineHook.mutate(context.courseId, getOutlineHook.data.id);

      send({ type: 'OUTLINE_APPROVED' });

      // Start lesson generation
      const result = await generateLessonsHook.mutate(context.courseId);
      if (result.job) {
        send({ type: 'LESSON_JOB_STARTED', jobId: result.job.id });
      }
    } catch (error) {
      send({ type: 'ERROR', error: error instanceof Error ? error.message : 'Failed to approve outline' });
    }
  }, [context.courseId, getOutlineHook.data, approveOutlineHook, generateLessonsHook, send]);

  // Handle outline rejection with reason
  const handleRejectOutline = useCallback(async (reason: string) => {
    if (!context.courseId || !getOutlineHook.data) return;

    try {
      await rejectOutlineHook.mutate(context.courseId, getOutlineHook.data.id, reason);
      send({ type: 'OUTLINE_REJECTED' });
    } catch (error) {
      send({ type: 'ERROR', error: error instanceof Error ? error.message : 'Failed to reject outline' });
    }
  }, [context.courseId, getOutlineHook.data, rejectOutlineHook, send]);

  // Handle outline update
  const handleUpdateOutline = useCallback(async (sections: OutlineSection[]) => {
    if (!context.courseId || !getOutlineHook.data) return;

    try {
      await updateOutlineHook.mutate(context.courseId, getOutlineHook.data.id, sections);
      getOutlineHook.refetch();
    } catch (error) {
      console.error('Failed to update outline:', error);
    }
  }, [context.courseId, getOutlineHook.data, updateOutlineHook, getOutlineHook]);

  // Handle outline regeneration
  const handleRegenerateOutline = useCallback(async () => {
    if (!context.courseId) return;

    try {
      const result = await generateOutlineHook.mutate({
        courseId: context.courseId,
        smeIds: context.selectedSmeIds,
        targetAudienceIds: context.selectedAudienceIds,
        desiredOutcome: context.desiredOutcome,
      });

      if (result.job) {
        send({ type: 'OUTLINE_JOB_STARTED', jobId: result.job.id });
      }
    } catch (error) {
      send({ type: 'ERROR', error: error instanceof Error ? error.message : 'Failed to regenerate outline' });
    }
  }, [context.courseId, context.selectedSmeIds, context.selectedAudienceIds, context.desiredOutcome, generateOutlineHook, send]);

  // Watch for lesson job completion
  useEffect(() => {
    if (!lessonJob || state.value !== 'generatingLessons') return;

    if (lessonJob.status === GenerationJobStatus.COMPLETED) {
      // Fetch lessons and transform content
      listLessonsHook.refetch().then(async () => {
        const lessons = listLessonsHook.data || [];
        const outline = getOutlineHook.data;

        if (lessons.length > 0 && outline && context.courseId) {
          // Transform content
          const { sections, courseBlocks: generatedBlocks } = generatedLessonsToCourseContent(lessons, outline);
          const apiContent = toApiFormat({ sections, courseBlocks: generatedBlocks });

          // Update course with content
          await updateCourseHook.mutate(context.courseId, {
            content: apiContent,
          });

          // Course data will be refetched via Connect-Query automatic refetch
        }

        send({ type: 'GENERATION_COMPLETE' });
      });
    } else if (lessonJob.status === GenerationJobStatus.FAILED) {
      send({ type: 'ERROR', error: lessonJob.errorMessage || 'Lesson generation failed' });
    }
  }, [lessonJob, state.value, listLessonsHook, getOutlineHook.data, context.courseId, updateCourseHook, send]);

  // ============================================================
  // Step Handlers
  // ============================================================
  const handleNext = useCallback(async () => {
    // Create course when leaving step 1 if not already created
    if (context.currentStep === 1 && !context.courseId) {
      await createCourseIfNeeded();
    }
    send({ type: 'NEXT' });
  }, [context.currentStep, context.courseId, createCourseIfNeeded, send]);

  const handlePrevious = useCallback(() => {
    send({ type: 'PREVIOUS' });
  }, [send]);

  const handleGoToStep = useCallback((step: number) => {
    send({ type: 'GO_TO_STEP', step });
  }, [send]);

  // ============================================================
  // Render Step Content
  // ============================================================
  const renderStepContent = () => {
    const stateValue = typeof state.value === 'string' ? state.value : Object.keys(state.value)[0];

    switch (stateValue) {
      case 'courseBasics':
        return (
          <CourseBasicsStep
            title={context.title}
            desiredOutcome={context.desiredOutcome}
            onTitleChange={(title) => send({ type: 'SET_TITLE', title })}
            onOutcomeChange={(outcome) => send({ type: 'SET_DESIRED_OUTCOME', outcome })}
            onNext={handleNext}
            canProceed={context.title.trim().length > 0 && context.desiredOutcome.trim().length > 0}
          />
        );

      case 'smeSelection':
        return (
          <SMESelectionStep
            selectedSmeIds={context.selectedSmeIds}
            onToggleSme={(smeId) => send({ type: 'TOGGLE_SME', smeId })}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canProceed={context.selectedSmeIds.length > 0}
          />
        );

      case 'audienceSelection':
        return (
          <AudienceSelectionStep
            selectedAudienceIds={context.selectedAudienceIds}
            onToggleAudience={(audienceId) => send({ type: 'TOGGLE_AUDIENCE', audienceId })}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canProceed={context.selectedAudienceIds.length > 0}
          />
        );

      case 'reviewGenerate':
        return (
          <ReviewGenerateStep
            title={context.title}
            desiredOutcome={context.desiredOutcome}
            selectedSmeIds={context.selectedSmeIds}
            selectedAudienceIds={context.selectedAudienceIds}
            isGenerating={false}
            onGenerate={handleStartGeneration}
            onPrevious={handlePrevious}
            onEditStep={handleGoToStep}
          />
        );

      case 'generatingOutline':
        return (
          <GenerationProgressPanel
            currentStep="generating-outline"
            progressPercent={outlineJob?.progressPercent || 0}
            progressMessage={outlineJob?.progressMessage || 'Generating course outline...'}
            job={outlineJob}
          />
        );

      case 'outlineReview':
        return getOutlineHook.data ? (
          <OutlineReviewPanel
            outline={getOutlineHook.data}
            onApprove={handleApproveOutline}
            onReject={handleRejectOutline}
            onUpdate={handleUpdateOutline}
            onRegenerate={handleRegenerateOutline}
            isUpdating={updateOutlineHook.isLoading}
            isApproving={approveOutlineHook.isLoading}
          />
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        );

      case 'generatingLessons':
        return (
          <GenerationProgressPanel
            currentStep="generating-lessons"
            progressPercent={lessonJob?.progressPercent || 0}
            progressMessage={lessonJob?.progressMessage || 'Generating lesson content...'}
            job={lessonJob}
          />
        );

      case 'editor':
        return <CourseEditor courseId={context.courseId!} onPreview={() => send({ type: 'NEXT' })} />;

      case 'preview':
        return <CoursePreview courseId={context.courseId!} onBack={() => send({ type: 'PREVIOUS' })} />;

      default:
        return null;
    }
  };

  // ============================================================
  // Full-screen layouts for editor/preview
  // ============================================================
  const stateValue = typeof state.value === 'string' ? state.value : Object.keys(state.value)[0];

  if (stateValue === 'editor' || stateValue === 'preview') {
    return (
      <div className="h-screen flex flex-col">
        {renderStepContent()}
      </div>
    );
  }

  // ============================================================
  // Main Layout
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEP_LABELS.slice(0, 4).map((stepInfo, index) => {
              const isActive = context.currentStep === stepInfo.step;
              const isCompleted = context.currentStep > stepInfo.step;
              const isClickable = isCompleted;

              return (
                <React.Fragment key={stepInfo.step}>
                  <button
                    onClick={() => isClickable && handleGoToStep(stepInfo.step)}
                    disabled={!isClickable}
                    className={`flex items-center gap-3 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                        ${isActive ? 'bg-indigo-600 text-white' : ''}
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                      `}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : stepInfo.step}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className={`text-sm font-medium ${isActive ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {stepInfo.label}
                      </p>
                      <p className="text-xs text-gray-500">{stepInfo.description}</p>
                    </div>
                  </button>

                  {index < 3 && (
                    <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {renderStepContent()}
      </div>
    </div>
  );
}
