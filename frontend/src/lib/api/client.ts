/**
 * API client for Mirai backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mirai-api.sogos.io';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Fetch with credentials (cookies) included
 */
export async function fetchAPI<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Send cookies for Kratos session
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new APIError(
      response.status,
      error.error || error.message || `HTTP ${response.status}`
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * API methods
 */
export const api = {
  // User endpoints
  me: () => fetchAPI<UserWithCompany>('/api/v1/me'),

  onboard: (data: OnboardRequest) =>
    fetchAPI<UserWithCompany>('/api/v1/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Company endpoints
  getCompany: () => fetchAPI<Company>('/api/v1/company'),

  updateCompany: (data: Partial<Company>) =>
    fetchAPI<Company>('/api/v1/company', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Team endpoints
  listTeams: () => fetchAPI<Team[]>('/api/v1/teams'),

  createTeam: (data: CreateTeamRequest) =>
    fetchAPI<Team>('/api/v1/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTeam: (id: string) => fetchAPI<Team>(`/api/v1/teams/${id}`),

  updateTeam: (id: string, data: UpdateTeamRequest) =>
    fetchAPI<Team>(`/api/v1/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTeam: (id: string) =>
    fetchAPI<void>(`/api/v1/teams/${id}`, {
      method: 'DELETE',
    }),

  // Team member endpoints
  listTeamMembers: (teamId: string) =>
    fetchAPI<TeamMember[]>(`/api/v1/teams/${teamId}/members`),

  addTeamMember: (teamId: string, data: AddTeamMemberRequest) =>
    fetchAPI<TeamMember>(`/api/v1/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeTeamMember: (teamId: string, userId: string) =>
    fetchAPI<void>(`/api/v1/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    }),
};

// Types (matching backend models)
export interface Company {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  kratos_id: string;
  company_id?: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface UserWithCompany {
  user: User;
  company?: Company;
}

export interface Team {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'lead' | 'member';
  created_at: string;
}

export interface OnboardRequest {
  company_name: string;
  plan: 'starter' | 'pro' | 'enterprise';
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface AddTeamMemberRequest {
  user_id: string;
  role: 'lead' | 'member';
}
