/**
 * Proto Display Converters
 *
 * Convert proto enums to human-readable display strings for UI rendering.
 * This is the ONLY place where enum-to-string conversion happens.
 *
 * These functions are for UI display only - not for API communication.
 * Proto enums should flow through the system unchanged.
 */

import {
  Plan,
  Role,
  TeamRole,
  SubscriptionStatus,
} from '@/gen/mirai/v1/common_pb';

/**
 * Convert Plan enum to display string
 */
export function planToDisplayString(plan: Plan): string {
  const map: Record<Plan, string> = {
    [Plan.UNSPECIFIED]: 'None',
    [Plan.STARTER]: 'Starter',
    [Plan.PRO]: 'Pro',
    [Plan.ENTERPRISE]: 'Enterprise',
  };
  return map[plan] ?? 'Unknown';
}

/**
 * Convert Role enum to display string
 * LMS roles: Owner has billing access, Admin manages company, Instructor creates content, SME reviews.
 */
export function roleToDisplayString(role: Role): string {
  const map: Record<Role, string> = {
    [Role.UNSPECIFIED]: 'Unknown',
    [Role.OWNER]: 'Owner',       // Account owner with billing access
    [Role.ADMIN]: 'Admin',
    [Role.MEMBER]: 'Member',     // Deprecated: basic member
    [Role.INSTRUCTOR]: 'Instructor',
    [Role.SME]: 'SME',
  };
  return map[role] ?? 'Unknown';
}

/**
 * Get badge color classes for a role
 */
export function getRoleBadgeColor(role: Role): string {
  const map: Record<Role, string> = {
    [Role.UNSPECIFIED]: 'bg-slate-100 text-slate-600',
    [Role.OWNER]: 'bg-purple-100 text-purple-700',
    [Role.ADMIN]: 'bg-indigo-100 text-indigo-700',
    [Role.MEMBER]: 'bg-slate-100 text-slate-600',
    [Role.INSTRUCTOR]: 'bg-blue-100 text-blue-700',
    [Role.SME]: 'bg-green-100 text-green-700',
  };
  return map[role] ?? 'bg-slate-100 text-slate-600';
}

/**
 * Convert TeamRole enum to display string
 */
export function teamRoleToDisplayString(role: TeamRole): string {
  const map: Record<TeamRole, string> = {
    [TeamRole.UNSPECIFIED]: 'Unknown',
    [TeamRole.LEAD]: 'Lead',
    [TeamRole.MEMBER]: 'Member',
  };
  return map[role] ?? 'Unknown';
}

/**
 * Convert SubscriptionStatus enum to display string
 */
export function subscriptionStatusToDisplayString(
  status: SubscriptionStatus
): string {
  const map: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.UNSPECIFIED]: 'None',
    [SubscriptionStatus.NONE]: 'None',
    [SubscriptionStatus.ACTIVE]: 'Active',
    [SubscriptionStatus.PAST_DUE]: 'Past Due',
    [SubscriptionStatus.CANCELED]: 'Canceled',
  };
  return map[status] ?? 'Unknown';
}
