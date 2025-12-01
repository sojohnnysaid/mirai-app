'use client';

import { useEffect, useState } from 'react';
import type { GenerationJob, GenerationJobStatus } from '@/gen/mirai/v1/ai_generation_pb';
import { getStepLabel, type CourseGenerationContext } from '@/machines/courseGenerationMachine';

// Job status constants from proto
const JOB_STATUS = {
  UNSPECIFIED: 0,
  QUEUED: 1,
  PROCESSING: 2,
  COMPLETED: 3,
  FAILED: 4,
  CANCELLED: 5,
} as const;

interface GenerationProgressPanelProps {
  currentStep: CourseGenerationContext['currentStep'];
  progressPercent: number;
  progressMessage: string;
  job?: GenerationJob | null;
  onCancel?: () => void;
  error?: { message: string } | null;
  onRetry?: () => void;
}

const STEP_DEFINITIONS = [
  { key: 'configure', label: 'Configure', icon: '1' },
  { key: 'generating-outline', label: 'Generate Outline', icon: '2' },
  { key: 'review-outline', label: 'Review', icon: '3' },
  { key: 'generating-lessons', label: 'Generate Content', icon: '4' },
  { key: 'complete', label: 'Complete', icon: '5' },
];

export function GenerationProgressPanel({
  currentStep,
  progressPercent,
  progressMessage,
  job,
  onCancel,
  error,
  onRetry,
}: GenerationProgressPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track elapsed time during generation
  useEffect(() => {
    if (currentStep === 'generating-outline' || currentStep === 'generating-lessons') {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [currentStep]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status?: GenerationJobStatus): string => {
    if (!status) return 'bg-gray-400';
    switch (status) {
      case JOB_STATUS.QUEUED:
        return 'bg-yellow-500';
      case JOB_STATUS.PROCESSING:
        return 'bg-blue-500';
      case JOB_STATUS.COMPLETED:
        return 'bg-green-500';
      case JOB_STATUS.FAILED:
        return 'bg-red-500';
      case JOB_STATUS.CANCELLED:
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status?: GenerationJobStatus): string => {
    if (!status) return 'Unknown';
    switch (status) {
      case JOB_STATUS.QUEUED:
        return 'Queued';
      case JOB_STATUS.PROCESSING:
        return 'Processing';
      case JOB_STATUS.COMPLETED:
        return 'Completed';
      case JOB_STATUS.FAILED:
        return 'Failed';
      case JOB_STATUS.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const isGenerating = currentStep === 'generating-outline' || currentStep === 'generating-lessons';
  const currentStepIndex = STEP_DEFINITIONS.findIndex((s) => s.key === currentStep);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Course Generation</h2>
            <p className="text-indigo-100 text-sm mt-1">{getStepLabel(currentStep)}</p>
          </div>
          {isGenerating && (
            <div className="text-right">
              <div className="text-2xl font-mono text-white">{formatTime(elapsedTime)}</div>
              <div className="text-xs text-indigo-200">Elapsed</div>
            </div>
          )}
        </div>
      </div>

      {/* Step Indicators */}
      <div className="px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          {STEP_DEFINITIONS.map((step, index) => {
            const isActive = step.key === currentStep;
            const isComplete = index < currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${isComplete ? 'bg-green-500 text-white' : ''}
                      ${isActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse' : ''}
                      ${isFuture ? 'bg-gray-200 text-gray-400' : ''}
                    `}
                  >
                    {isComplete ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={`mt-1 text-xs ${isActive ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {index < STEP_DEFINITIONS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 transition-all ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Content */}
      <div className="p-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-red-800">Generation Failed</h4>
                <p className="mt-1 text-sm text-red-700">{error.message}</p>
              </div>
            </div>
            {onRetry && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onRetry}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        ) : isGenerating ? (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{progressMessage || 'Processing...'}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Job Details */}
            {job && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Job Status</span>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
                    <span className="font-medium">{getStatusLabel(job.status)}</span>
                  </span>
                </div>
                {job.tokensUsed > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tokens Used</span>
                    <span className="font-medium">{job.tokensUsed.toLocaleString()}</span>
                  </div>
                )}
                {job.retryCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Retry Attempts</span>
                    <span className="font-medium">
                      {job.retryCount} / {job.maxRetries}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Animated Icon */}
            <div className="flex justify-center py-4">
              <div className="relative">
                <svg
                  className="w-16 h-16 text-indigo-600 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              {currentStep === 'generating-outline'
                ? 'AI is analyzing your SME knowledge and creating a course structure...'
                : 'AI is generating detailed lesson content based on the approved outline...'}
            </p>
          </div>
        ) : currentStep === 'complete' ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Generation Complete!</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your course content has been generated and is ready for review.
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Waiting for generation to start...
          </div>
        )}
      </div>

      {/* Footer */}
      {isGenerating && onCancel && (
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel Generation
          </button>
        </div>
      )}
    </div>
  );
}
