'use client';

import { Clock, Eye, ArrowRight, CheckCircle2 } from 'lucide-react';

interface GenerationQueuedConfirmationProps {
  totalLessons: number;
  jobId: string;
  courseTitle?: string;
  onWaitForCompletion: () => void;
  onNavigateAway: () => void;
}

export function GenerationQueuedConfirmation({
  totalLessons,
  jobId,
  courseTitle,
  onWaitForCompletion,
  onNavigateAway,
}: GenerationQueuedConfirmationProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Course Generation Started!
      </h2>

      {/* Description */}
      <p className="text-gray-600 text-center mb-8 max-w-md">
        {courseTitle ? (
          <>
            <strong>{courseTitle}</strong> has been queued for generation.{' '}
          </>
        ) : (
          'Your course has been queued for generation. '
        )}
        <span className="font-medium text-indigo-600">{totalLessons} lessons</span> will be created using AI.
      </p>

      {/* Info Box */}
      <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Generation takes a few minutes</p>
            <p className="text-blue-700">
              Each lesson is carefully crafted from your SME knowledge. You can wait here to watch
              the progress, or continue working and receive a notification when complete.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={onWaitForCompletion}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Eye className="w-5 h-5" />
          Watch Progress
        </button>
        <button
          onClick={onNavigateAway}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          I'll Come Back Later
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Job ID for reference */}
      <p className="text-xs text-gray-400 mt-6">
        Job ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{jobId}</code>
      </p>
    </div>
  );
}
