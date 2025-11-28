'use client';

import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api/client';

interface EmailStepProps {
  email: string;
  onChange: (email: string) => void;
  onNext: () => void;
}

export default function EmailStep({ email, onChange, onNext }: EmailStepProps) {
  const [touched, setTouched] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showFormatError = touched && email && !isValidEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;

    setIsChecking(true);
    setEmailExists(false);

    try {
      const result = await api.checkEmail(email);
      if (result.exists) {
        setEmailExists(true);
      } else {
        onNext();
      }
    } catch (err) {
      console.error('Failed to check email:', err);
      // On error, allow proceeding (will fail at registration if duplicate)
      onNext();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Let's get started</h2>
        <p className="text-slate-600 mt-1">Enter your work email to begin</p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              onChange(e.target.value);
              setEmailExists(false);
            }}
            onBlur={() => setTouched(true)}
            placeholder="you@company.com"
            autoFocus
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              showFormatError || emailExists ? 'border-red-300' : 'border-slate-300'
            }`}
          />
        </div>
        {showFormatError && (
          <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
        )}
        {emailExists && (
          <p className="mt-1 text-sm text-red-600">
            An account with this email already exists.{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in instead
            </Link>
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValidEmail || isChecking}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
      >
        {isChecking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
