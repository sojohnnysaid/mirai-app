'use client';

import React from 'react';
import { Building2, ArrowRight, ArrowLeft } from 'lucide-react';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Media & Entertainment',
  'Government',
  'Non-profit',
  'Other',
];

const TEAM_SIZES = [
  { value: 'just-me', label: 'Just me' },
  { value: '2-10', label: '2-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '200+', label: '200+' },
];

interface OrgInfoStepProps {
  companyName: string;
  industry: string;
  teamSize: string;
  onChange: (data: { companyName?: string; industry?: string; teamSize?: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function OrgInfoStep({
  companyName,
  industry,
  teamSize,
  onChange,
  onNext,
  onBack,
}: OrgInfoStepProps) {
  const isValid = companyName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Tell us about your organization</h2>
        <p className="text-slate-600 mt-1">This helps us personalize your experience</p>
      </div>

      {/* Company Name */}
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
          Company name
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder="Acme Inc."
            autoFocus
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Industry */}
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-1">
          Industry <span className="text-slate-400">(optional)</span>
        </label>
        <select
          id="industry"
          value={industry}
          onChange={(e) => onChange({ industry: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Select industry</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind.toLowerCase()}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      {/* Team Size */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Team size <span className="text-slate-400">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TEAM_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => onChange({ teamSize: size.value })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                teamSize === size.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
