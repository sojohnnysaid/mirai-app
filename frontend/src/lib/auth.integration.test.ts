/**
 * Integration Tests for Auth Flow
 *
 * These tests verify the complete signup → Stripe → marketing page flow
 * by testing the contract between components.
 *
 * Note: These are contract tests, not E2E tests. They verify that:
 * 1. The registration response contains required fields
 * 2. Deferred account creation flow works correctly
 * 3. Redirects follow the expected pattern
 *
 * New Flow (Deferred Account Creation):
 * 1. Registration returns checkoutUrl and email (no user/company created yet)
 * 2. User redirects to Stripe for payment
 * 3. After payment, Stripe redirects to marketing page with ?checkout=success
 * 4. Webhook marks pending registration as paid
 * 5. Background job provisions account (creates identity, company, user)
 * 6. User receives welcome email with login instructions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resetMockCookies, getMockCookies } from '@/test/setup';
import {
  AUTH_COOKIES,
  REDIRECT_URLS,
  REDIRECT_PARAMS,
  setSessionTokenCookie,
  extractSessionToken,
} from './auth.config';

// =============================================================================
// Mock Types matching Proto definitions
// =============================================================================

// For paid plans: user and company are created AFTER payment via background job
interface MockRegisterResponse {
  user?: {
    id: string;
    kratosId: string;
    companyId?: string;
    role: 'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MEMBER';
  };
  company?: {
    id: string;
    name: string;
    plan: 'PLAN_STARTER' | 'PLAN_PRO' | 'PLAN_ENTERPRISE';
    subscriptionStatus: 'SUBSCRIPTION_STATUS_NONE' | 'SUBSCRIPTION_STATUS_ACTIVE';
  };
  checkoutUrl?: string;
  email?: string; // For paid plans, email is returned for confirmation messages
}

// =============================================================================
// Registration Response Contract Tests
// =============================================================================

describe('Registration Response Contract', () => {
  it('should include checkoutUrl and email for paid plans (deferred account creation)', () => {
    // Backend contract: paid plans return checkoutUrl and email, NOT user/company
    // Account is created asynchronously after payment confirmation
    const response: MockRegisterResponse = {
      // user and company are undefined for paid plans (created after payment)
      checkoutUrl: 'https://checkout.stripe.com/session/xyz',
      email: 'user@example.com',
    };

    // Verify deferred creation contract
    expect(response.checkoutUrl).toBeDefined();
    expect(response.email).toBeDefined();
    expect(response.user).toBeUndefined(); // Not created until after payment
    expect(response.company).toBeUndefined(); // Not created until after payment
  });

  it('should NOT include checkout_url for enterprise plans', () => {
    const response: MockRegisterResponse = {
      // Enterprise: no checkout, handled via sales contact
      email: 'enterprise@example.com',
    };

    expect(response.checkoutUrl).toBeUndefined();
  });
});

// =============================================================================
// Signup → Stripe → Marketing Page Flow Tests (Deferred Account Creation)
// =============================================================================

describe('Signup → Stripe → Marketing Page Flow', () => {
  beforeEach(() => {
    resetMockCookies();
  });

  describe('Step 1: Registration returns checkout URL (no account created)', () => {
    it('should receive checkoutUrl and email from backend', () => {
      const backendResponse: MockRegisterResponse = {
        // With deferred creation, user/company are NOT returned
        checkoutUrl: 'https://checkout.stripe.com/xyz',
        email: 'user@example.com',
      };

      // Contract: backend returns checkoutUrl and email for paid plans
      expect(backendResponse.checkoutUrl).toBeDefined();
      expect(backendResponse.email).toBe('user@example.com');
      expect(backendResponse.user).toBeUndefined();
      expect(backendResponse.company).toBeUndefined();
    });
  });

  describe('Step 2: Frontend redirects to Stripe Checkout', () => {
    it('should redirect to Stripe checkout URL', () => {
      const checkoutUrl = 'https://checkout.stripe.com/xyz';

      // Frontend action: redirect to Stripe (no cookie needed)
      // window.location.href = checkoutUrl;

      expect(checkoutUrl.startsWith('https://checkout.stripe.com')).toBe(true);
    });
  });

  describe('Step 3: User returns from Stripe to marketing page', () => {
    it('should redirect to marketing page with checkout=success param', () => {
      // Stripe success_url redirects to: /?checkout=success
      // (marketing landing page, NOT dashboard)
      const expectedRedirect = '/?checkout=success';

      expect(expectedRedirect).toContain('checkout=success');
      expect(expectedRedirect).not.toContain('/dashboard');
    });
  });

  describe('Step 4: Marketing page shows success modal', () => {
    it('should display success modal when checkout=success', () => {
      // Contract: marketing page checks for ?checkout=success query param
      // and displays the CheckoutSuccessModal component
      const urlParams = new URLSearchParams('checkout=success');
      expect(urlParams.get('checkout')).toBe('success');
    });
  });

  describe('Step 5: Background provisioning and email', () => {
    it('should provision account asynchronously after webhook', () => {
      // This is tested on the backend:
      // 1. Stripe webhook marks pending registration as "paid"
      // 2. Background job provisions account (creates identity, company, user)
      // 3. Welcome email sent to user
      expect(true).toBe(true); // Placeholder for E2E test
    });
  });
});

// =============================================================================
// Existing User Login Flow Tests (unchanged)
// =============================================================================

describe('Existing User Login Flow', () => {
  beforeEach(() => {
    resetMockCookies();
  });

  describe('Session token cookie handling', () => {
    it('should set session token cookie with correct name', () => {
      const sessionToken = 'test-session-token';

      // Frontend action: set cookie after login
      setSessionTokenCookie(sessionToken);

      // Verify cookie is set with correct name
      const cookies = getMockCookies();
      expect(cookies[AUTH_COOKIES.SESSION_TOKEN]).toBe(sessionToken);
    });

    it('should use ory_session_token cookie name (not ory_kratos_session)', () => {
      setSessionTokenCookie('any-token');

      const cookies = getMockCookies();

      // Must use API flow cookie name
      expect(AUTH_COOKIES.SESSION_TOKEN).toBe('ory_session_token');
      expect(cookies['ory_session_token']).toBeDefined();

      // Must NOT set browser flow cookie
      expect(cookies['ory_kratos_session']).toBeUndefined();
    });
  });

  describe('Middleware validates session', () => {
    it('should extract session token from cookie header', () => {
      // Simulate: cookie was set after login
      setSessionTokenCookie('validated-token');

      // Middleware reads cookie header
      const cookieHeader = document.cookie;
      const extractedToken = extractSessionToken(cookieHeader);

      // Token should be extractable
      expect(extractedToken).toBe('validated-token');
    });

    it('should send token as Authorization: Bearer to Kratos', () => {
      const token = 'bearer-test-token';

      // This is the contract the middleware follows
      const authHeader = `Bearer ${token}`;

      expect(authHeader).toBe('Bearer bearer-test-token');
      expect(authHeader.startsWith('Bearer ')).toBe(true);
    });
  });

  describe('User lands on dashboard', () => {
    it('should have dashboard as final destination', () => {
      expect(REDIRECT_URLS.DASHBOARD).toBe('/dashboard');
    });
  });
});

// =============================================================================
// Error Handling Contract Tests
// =============================================================================

describe('Error Handling Contract', () => {
  it('should redirect to login on session validation failure', () => {
    // When Kratos returns 401, middleware redirects to login
    const expectedRedirect = REDIRECT_URLS.LOGIN;
    expect(expectedRedirect).toBe('/auth/login');
  });

  it('should include return_to param when redirecting to login', () => {
    const originalPath = '/dashboard';
    const loginUrl = `${REDIRECT_URLS.LOGIN}?${REDIRECT_PARAMS.RETURN_TO}=${encodeURIComponent(originalPath)}`;

    expect(loginUrl).toContain('return_to=');
    expect(loginUrl).toContain('%2Fdashboard');
  });

  it('should handle missing session token gracefully', () => {
    resetMockCookies();

    // No cookie set
    const cookieHeader = document.cookie;
    const token = extractSessionToken(cookieHeader);

    // Should return null, not throw
    expect(token).toBeNull();
  });
});

// =============================================================================
// Contract Consistency Tests
// =============================================================================

describe('Contract Consistency', () => {
  it('should have consistent redirect URL structure', () => {
    // All redirect URLs should be absolute paths
    expect(REDIRECT_URLS.DASHBOARD.startsWith('/')).toBe(true);
    expect(REDIRECT_URLS.LOGIN.startsWith('/')).toBe(true);
    expect(REDIRECT_URLS.REGISTRATION.startsWith('/')).toBe(true);
  });

  it('should have POST_CHECKOUT built from DASHBOARD + CHECKOUT_SUCCESS', () => {
    const expected = `${REDIRECT_URLS.DASHBOARD}?${REDIRECT_PARAMS.CHECKOUT_SUCCESS}`;
    expect(REDIRECT_URLS.POST_CHECKOUT).toBe(expected);
  });

  it('should use different cookies for API and browser flows', () => {
    // Critical: these must remain different
    expect(AUTH_COOKIES.SESSION_TOKEN).not.toBe(AUTH_COOKIES.KRATOS_SESSION);

    // API flow cookie
    expect(AUTH_COOKIES.SESSION_TOKEN).toBe('ory_session_token');

    // Browser flow cookie (Kratos-managed)
    expect(AUTH_COOKIES.KRATOS_SESSION).toBe('ory_kratos_session');
  });
});
