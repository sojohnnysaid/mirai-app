import { useQuery } from '@connectrpc/connect-query';
import { getMe } from '@/gen/mirai/v1/user-UserService_connectquery';
import { Role, type User, type Company } from '@/gen/mirai/v1/common_pb';

// Re-export types for convenience
export { Role };
export type { User, Company };

/**
 * Hook to get the current user from the backend via GetMe API.
 * Returns the user with their role and company information.
 */
export function useCurrentUser() {
  const query = useQuery(getMe, {});

  return {
    user: query.data?.user ?? null,
    company: query.data?.company ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Check if a user has admin privileges (ADMIN or OWNER role).
 * OWNER is deprecated but still supported for backwards compatibility.
 */
export function isAdminRole(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === Role.ADMIN || user.role === Role.OWNER;
}

/**
 * Check if a user has the owner role.
 * Note: OWNER is deprecated in favor of ADMIN.
 */
export function isOwnerRole(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === Role.OWNER;
}

/**
 * Hook that returns whether the current user is an admin.
 * Combines useCurrentUser with isAdminRole check.
 */
export function useIsAdmin() {
  const { user, isLoading } = useCurrentUser();

  return {
    isAdmin: isAdminRole(user),
    isLoading,
  };
}
