'use client';

import React, { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle, Send } from 'lucide-react';

interface EnterpriseContactProps {
  name: string;
  email: string;
  companyName: string;
  onSubmit: (message: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  isSubmitted: boolean;
}

export default function EnterpriseContact({
  name,
  email,
  companyName,
  onSubmit,
  onBack,
  isSubmitting,
  isSubmitted,
}: EnterpriseContactProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(message);
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Thank you!</h2>
        <p className="text-slate-600 mb-6">
          Our team will reach out to you within 24 hours to discuss your enterprise needs.
        </p>
        <a
          href="/"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Return to home
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Contact our sales team</h2>
        <p className="text-slate-600 mt-1">We'll help you find the right solution for your organization</p>
      </div>

      {/* Pre-filled info */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Name</span>
          <span className="font-medium text-slate-900">{name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Email</span>
          <span className="font-medium text-slate-900">{email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Company</span>
          <span className="font-medium text-slate-900">{companyName}</span>
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
          Tell us about your needs <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What are you hoping to achieve with Mirai? Any specific requirements?"
          rows={4}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send message
            </>
          )}
        </button>
      </div>
    </form>
  );
}
