'use client';

import React from 'react';
import { CreditCard, ExternalLink, AlertCircle, Check, Users, Mail } from 'lucide-react';
import {
  useGetBillingQuery,
  useCreateCheckoutSessionMutation,
  useCreatePortalSessionMutation,
  BillingInfo
} from '@/store/api/apiSlice';

// Plan configuration
const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    pricePerSeat: 8,
    description: 'For small teams getting started',
    features: [
      'Up to 10 team members',
      'Basic course builder',
      'Email support',
      '5GB storage'
    ]
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    pricePerSeat: 12,
    description: 'For growing organizations',
    features: [
      'Unlimited team members',
      'Advanced course builder',
      'Priority support',
      '50GB storage',
      'Custom branding',
      'Analytics dashboard'
    ],
    popular: true
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    pricePerSeat: null, // Contact us
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Unlimited storage',
      'SSO/SAML',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
];

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-100 text-green-700', label: 'Active' },
    past_due: { color: 'bg-yellow-100 text-yellow-700', label: 'Past Due' },
    canceled: { color: 'bg-red-100 text-red-700', label: 'Canceled' },
    none: { color: 'bg-gray-100 text-gray-700', label: 'No Subscription' }
  };

  const config = statusConfig[status] || statusConfig.none;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export default function BillingSettings() {
  const { data: billing, isLoading, error } = useGetBillingQuery();
  const [createCheckout, { isLoading: isCheckoutLoading }] = useCreateCheckoutSessionMutation();
  const [createPortal, { isLoading: isPortalLoading }] = useCreatePortalSessionMutation();

  const handleSubscribe = async (plan: 'starter' | 'pro') => {
    try {
      const result = await createCheckout({ plan }).unwrap();
      window.location.href = result.url;
    } catch (err) {
      console.error('Failed to create checkout session:', err);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const result = await createPortal().unwrap();
      window.location.href = result.url;
    } catch (err) {
      console.error('Failed to create portal session:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load billing</h3>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === billing?.plan) || plans[0];
  const hasActiveSubscription = billing?.status === 'active';
  const monthlyTotal = billing ? (billing.seat_count * billing.price_per_seat) : 0;

  return (
    <div>
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">
        Billing & Subscription
      </h2>

      {/* Current Plan Card */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{currentPlan.name} Plan</h3>
              <StatusBadge status={billing?.status || 'none'} />
            </div>
            <p className="text-gray-600">{currentPlan.description}</p>
          </div>
          <CreditCard className="w-8 h-8 text-primary-600 flex-shrink-0" />
        </div>

        {hasActiveSubscription && billing && (
          <>
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <Users className="w-4 h-4" />
              <span>
                {billing.seat_count} {billing.seat_count === 1 ? 'seat' : 'seats'} × {formatCurrency(billing.price_per_seat)}/seat = <strong>{formatCurrency(monthlyTotal)}/month</strong>
              </span>
            </div>

            {billing.current_period_end && (
              <p className="text-sm text-gray-600 mb-4">
                {billing.cancel_at_period_end
                  ? `Subscription ends on ${formatDate(billing.current_period_end)}`
                  : `Next billing date: ${formatDate(billing.current_period_end)}`
                }
              </p>
            )}

            <button
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              {isPortalLoading ? 'Opening...' : 'Manage Subscription'}
              <ExternalLink className="w-4 h-4" />
            </button>
          </>
        )}

        {!hasActiveSubscription && (
          <p className="text-sm text-gray-600">
            Choose a plan below to get started.
          </p>
        )}
      </div>

      {/* Plan Selection */}
      <h3 className="font-semibold text-gray-900 mb-4">
        {hasActiveSubscription ? 'Change Plan' : 'Choose a Plan'}
      </h3>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === billing?.plan && hasActiveSubscription;
          const isEnterprise = plan.id === 'enterprise';

          return (
            <div
              key={plan.id}
              className={`relative border rounded-xl p-5 ${
                plan.popular
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : 'border-gray-200'
              } ${isCurrentPlan ? 'bg-gray-50' : 'bg-white'}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <h4 className="font-semibold text-gray-900 mb-1">{plan.name}</h4>

              {plan.pricePerSeat ? (
                <div className="mb-3">
                  <span className="text-2xl font-bold text-gray-900">${plan.pricePerSeat}</span>
                  <span className="text-gray-600">/seat/month</span>
                </div>
              ) : (
                <div className="mb-3">
                  <span className="text-2xl font-bold text-gray-900">Custom</span>
                </div>
              )}

              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

              <ul className="space-y-2 mb-5">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full py-2.5 px-4 rounded-lg bg-gray-100 text-gray-500 font-medium cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : isEnterprise ? (
                <a
                  href="mailto:sales@mirai.io?subject=Enterprise%20Plan%20Inquiry"
                  className="w-full py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact Sales
                </a>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id as 'starter' | 'pro')}
                  disabled={isCheckoutLoading}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'border border-primary-600 text-primary-600 hover:bg-primary-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCheckoutLoading ? 'Loading...' : hasActiveSubscription ? 'Switch Plan' : 'Get Started'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <p className="text-sm text-gray-500 mt-6 text-center">
        All plans are billed monthly per seat. You can change or cancel anytime.
      </p>
    </div>
  );
}
