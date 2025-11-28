'use client';

import React from 'react';
import { Minus, Plus, ArrowLeft, Loader2, Mail } from 'lucide-react';

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    pricePerSeat: 8,
    description: 'For small teams getting started',
    features: [
      'Up to 10 team members',
      'Basic course builder',
      'Email support',
      '5GB storage',
    ],
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
      'Analytics dashboard',
    ],
    popular: true,
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    pricePerSeat: null,
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Unlimited storage',
      'SSO/SAML',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
];

interface PlanStepProps {
  plan: 'starter' | 'pro' | 'enterprise';
  seatCount: number;
  onChange: (data: { plan?: 'starter' | 'pro' | 'enterprise'; seatCount?: number }) => void;
  onSubmit: () => void;
  onBack: () => void;
  onEnterprise: () => void;
  isSubmitting: boolean;
}

export default function PlanStep({
  plan,
  seatCount,
  onChange,
  onSubmit,
  onBack,
  onEnterprise,
  isSubmitting,
}: PlanStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan === 'enterprise') {
      onEnterprise();
    } else {
      onSubmit();
    }
  };

  const selectedPlan = PLANS.find((p) => p.id === plan) || PLANS[1];
  const monthlyTotal = selectedPlan.pricePerSeat ? selectedPlan.pricePerSeat * seatCount : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Choose your plan</h2>
        <p className="text-slate-600 mt-1">No hidden fees. Cancel anytime.</p>
      </div>

      {/* Plan cards */}
      <div className="space-y-3">
        {PLANS.map((p) => (
          <div
            key={p.id}
            onClick={() => onChange({ plan: p.id })}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
              plan === p.id
                ? 'border-indigo-600 bg-indigo-50/50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-2.5 left-4 bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                Most Popular
              </span>
            )}

            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-600">{p.description}</p>
              </div>
              <div className="text-right">
                {p.pricePerSeat ? (
                  <>
                    <span className="text-2xl font-bold text-slate-900">${p.pricePerSeat}</span>
                    <span className="text-slate-600">/seat/mo</span>
                  </>
                ) : (
                  <span className="text-lg font-semibold text-slate-900">Custom</span>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Seat selector */}
      <div className={`bg-slate-50 rounded-xl p-4 ${plan === 'enterprise' ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-slate-900">Number of seats</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange({ seatCount: Math.max(1, seatCount - 1) })}
              disabled={seatCount <= 1 || plan === 'enterprise'}
              className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={seatCount}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                onChange({ seatCount: Math.min(100, Math.max(1, val)) });
              }}
              min={1}
              max={100}
              disabled={plan === 'enterprise'}
              className="w-16 text-center py-1 border border-slate-300 rounded-lg font-medium disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => onChange({ seatCount: Math.min(100, seatCount + 1) })}
              disabled={seatCount >= 100 || plan === 'enterprise'}
              className="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className="text-slate-600">Monthly total</span>
          <span className="text-xl font-bold text-slate-900">
            {plan === 'enterprise' ? 'Custom pricing' : `$${monthlyTotal}/month`}
          </span>
        </div>
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
              Processing...
            </>
          ) : plan === 'enterprise' ? (
            <>
              <Mail className="w-4 h-4" />
              Contact Sales
            </>
          ) : (
            'Get Started'
          )}
        </button>
      </div>
    </form>
  );
}
