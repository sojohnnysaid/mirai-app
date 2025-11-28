'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Loader2 } from 'lucide-react';
import SignupWizard from '@/components/auth/signup/SignupWizard';
import { getSession } from '@/lib/kratos';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Get pre-selected tier from URL (from pricing page)
  const tier = searchParams.get('tier') as 'starter' | 'pro' | null;

  useEffect(() => {
    async function checkSession() {
      const session = await getSession();
      if (session?.active) {
        // Already logged in - check if they need onboarding or go to dashboard
        router.replace('/dashboard');
        return;
      }
      setLoading(false);
    }
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <BookOpen className="h-10 w-10 text-indigo-600" />
        <span className="text-2xl font-bold text-slate-900">Mirai</span>
      </Link>

      {/* Wizard Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <SignupWizard preselectedPlan={tier || 'pro'} />
        </div>

        {/* Links */}
        <div className="mt-6 text-center text-sm">
          <p className="text-slate-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="mt-4 text-xs text-slate-500 text-center">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-700">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-slate-700">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
