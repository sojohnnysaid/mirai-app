'use client';

import React from 'react';
import { BookOpen, Target } from 'lucide-react';

interface CourseBasicsStepProps {
  title: string;
  desiredOutcome: string;
  onTitleChange: (title: string) => void;
  onOutcomeChange: (outcome: string) => void;
  onNext: () => void;
  canProceed: boolean;
}

export default function CourseBasicsStep({
  title,
  desiredOutcome,
  onTitleChange,
  onOutcomeChange,
  onNext,
  canProceed,
}: CourseBasicsStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
          <BookOpen className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What's your course about?
        </h2>
        <p className="text-gray-600">
          Start by defining the basics. You can always refine these later.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        {/* Course Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Course Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Sales Objection Handling Masterclass"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          <p className="mt-1.5 text-sm text-gray-500">
            A clear, descriptive title helps learners understand what they'll learn
          </p>
        </div>

        {/* Learning Goal */}
        <div>
          <label htmlFor="outcome" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Target className="w-4 h-4 text-indigo-500" />
            Learning Goal
          </label>
          <textarea
            id="outcome"
            value={desiredOutcome}
            onChange={(e) => onOutcomeChange(e.target.value)}
            placeholder="e.g., By the end of this course, learners will be able to confidently handle common sales objections, turn hesitations into opportunities, and close more deals."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          />
          <p className="mt-1.5 text-sm text-gray-500">
            What should learners be able to do after completing this course?
          </p>
        </div>
      </div>

      {/* Next Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Knowledge Sources
        </button>
      </div>
    </div>
  );
}
