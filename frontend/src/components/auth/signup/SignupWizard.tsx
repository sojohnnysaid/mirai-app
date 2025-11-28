'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import WizardProgress from './WizardProgress';
import EmailStep from './EmailStep';
import OrgInfoStep from './OrgInfoStep';
import AccountStep from './AccountStep';
import PlanStep from './PlanStep';
import EnterpriseContact from './EnterpriseContact';

const STEPS = ['Email', 'Organization', 'Account', 'Plan'];

interface SignupWizardProps {
  preselectedPlan?: 'starter' | 'pro';
}

interface WizardData {
  email: string;
  companyName: string;
  industry: string;
  teamSize: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  plan: 'starter' | 'pro' | 'enterprise';
  seatCount: number;
}

export default function SignupWizard({ preselectedPlan = 'pro' }: SignupWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showEnterpriseContact, setShowEnterpriseContact] = useState(false);
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<WizardData>({
    email: '',
    companyName: '',
    industry: '',
    teamSize: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    plan: preselectedPlan,
    seatCount: 1,
  });

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError(null);
    if (showEnterpriseContact) {
      setShowEnterpriseContact(false);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  // Handle account step completion (just move to next step, no Kratos call)
  const handleAccountNext = () => {
    handleNext();
  };

  // Handle final registration - calls our backend API
  const handleRegister = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.register({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        company_name: data.companyName,
        industry: data.industry || undefined,
        team_size: data.teamSize || undefined,
        plan: data.plan,
        seat_count: data.seatCount,
      });

      // If checkout URL is provided, redirect to Stripe
      if (response.checkout_url) {
        // Set cookie so middleware can skip password reset after checkout
        document.cookie = 'pending_checkout_login=true; path=/; max-age=3600; SameSite=Lax';
        window.location.href = response.checkout_url;
      } else {
        // Enterprise or no checkout needed - go to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  // Handle enterprise contact submission
  const handleEnterpriseContact = async (message: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await api.enterpriseContact({
        company_name: data.companyName,
        industry: data.industry || undefined,
        team_size: data.teamSize || undefined,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        message: message || undefined,
      });

      setEnterpriseSubmitted(true);
    } catch (err) {
      console.error('Enterprise contact error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (showEnterpriseContact) {
      return (
        <EnterpriseContact
          name={`${data.firstName} ${data.lastName}`}
          email={data.email}
          companyName={data.companyName}
          onSubmit={handleEnterpriseContact}
          onBack={handleBack}
          isSubmitting={isSubmitting}
          isSubmitted={enterpriseSubmitted}
        />
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <EmailStep
            email={data.email}
            onChange={(email) => updateData({ email })}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <OrgInfoStep
            companyName={data.companyName}
            industry={data.industry}
            teamSize={data.teamSize}
            onChange={(updates) => updateData(updates)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <AccountStep
            firstName={data.firstName}
            lastName={data.lastName}
            password={data.password}
            confirmPassword={data.confirmPassword}
            onChange={(updates) => updateData(updates)}
            onSubmit={handleAccountNext}
            onBack={handleBack}
            isSubmitting={false}
            error={null}
          />
        );
      case 3:
        return (
          <PlanStep
            plan={data.plan}
            seatCount={data.seatCount}
            onChange={(updates) => updateData(updates)}
            onSubmit={handleRegister}
            onBack={handleBack}
            onEnterprise={() => setShowEnterpriseContact(true)}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {!showEnterpriseContact && !enterpriseSubmitted && (
        <WizardProgress steps={STEPS} currentStep={currentStep} />
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="animate-fadeIn">{renderStep()}</div>
    </div>
  );
}
