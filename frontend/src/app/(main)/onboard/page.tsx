'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, APIError } from '@/lib/api/client';

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$29/mo' },
  { id: 'pro', name: 'Pro', price: '$99/mo' },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom' },
] as const;

export default function OnboardPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // Check if user is already onboarded
    const checkOnboardingStatus = async () => {
      try {
        const userData = await api.me();
        if (userData.company) {
          // User is already onboarded, redirect to dashboard
          router.push('/dashboard');
        } else {
          setCheckingStatus(false);
        }
      } catch (err) {
        if (err instanceof APIError && err.status === 404) {
          // User exists but not onboarded yet
          setCheckingStatus(false);
        } else {
          // Some other error, redirect to login
          router.push('/auth/login');
        }
      }
    };

    checkOnboardingStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.onboard({
        company_name: companyName,
        plan: selectedPlan,
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to complete onboarding. Please try again.');
      }
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Setup
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Let's get your organization set up
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Plan
              </label>
              <div className="space-y-2">
                {PLANS.map((plan) => (
                  <div key={plan.id} className="flex items-center">
                    <input
                      id={plan.id}
                      name="plan"
                      type="radio"
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label htmlFor={plan.id} className="ml-3 block text-sm font-medium text-gray-700">
                      {plan.name} - {plan.price}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !companyName.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
