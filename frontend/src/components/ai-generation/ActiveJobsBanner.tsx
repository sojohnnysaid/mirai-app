'use client';

import { Loader2, ArrowRight } from 'lucide-react';
import type { GenerationJob } from '@/gen/mirai/v1/ai_generation_pb';
import { GenerationJobType, GenerationJobStatus } from '@/gen/mirai/v1/ai_generation_pb';

interface ActiveJobsBannerProps {
  jobs: GenerationJob[];
  onViewProgress?: (job: GenerationJob) => void;
}

function getJobTypeLabel(type: GenerationJobType): string {
  switch (type) {
    case GenerationJobType.COURSE_OUTLINE:
      return 'Outline';
    case GenerationJobType.LESSON_CONTENT:
      return 'Lesson';
    case GenerationJobType.FULL_COURSE:
      return 'Course';
    default:
      return 'Content';
  }
}

function getStatusLabel(status: GenerationJobStatus): string {
  switch (status) {
    case GenerationJobStatus.QUEUED:
      return 'Queued';
    case GenerationJobStatus.PROCESSING:
      return 'Generating';
    default:
      return 'In Progress';
  }
}

export function ActiveJobsBanner({ jobs, onViewProgress }: ActiveJobsBannerProps) {
  if (jobs.length === 0) return null;

  // Group jobs by course
  const jobsByCourse = jobs.reduce((acc, job) => {
    const courseId = job.courseId || 'unknown';
    if (!acc[courseId]) {
      acc[courseId] = [];
    }
    acc[courseId].push(job);
    return acc;
  }, {} as Record<string, GenerationJob[]>);

  const courseCount = Object.keys(jobsByCourse).length;

  // Find the most relevant job to show (prefer FULL_COURSE or COURSE_OUTLINE)
  const primaryJob = jobs.find(j => j.type === GenerationJobType.FULL_COURSE)
    || jobs.find(j => j.type === GenerationJobType.COURSE_OUTLINE)
    || jobs[0];

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {courseCount === 1
                ? 'Course Generation in Progress'
                : `${courseCount} Courses Generating`}
            </h3>
            <p className="text-white/80 text-sm">
              {primaryJob.progressMessage || `${getStatusLabel(primaryJob.status)} - ${primaryJob.progressPercent}% complete`}
            </p>
          </div>
        </div>

        {onViewProgress && (
          <button
            onClick={() => onViewProgress(primaryJob)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
          >
            View Progress
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${primaryJob.progressPercent || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
