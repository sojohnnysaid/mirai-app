import { useQuery, useMutation, createConnectQueryKey } from '@connectrpc/connect-query';
import { useQueryClient } from '@tanstack/react-query';
import { create } from '@bufbuild/protobuf';
import {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  listTeamMembers,
  addTeamMember,
  removeTeamMember,
} from '@/gen/mirai/v1/team-TeamService_connectquery';
import {
  CreateTeamRequestSchema,
  UpdateTeamRequestSchema,
  DeleteTeamRequestSchema,
  AddTeamMemberRequestSchema,
  RemoveTeamMemberRequestSchema,
} from '@/gen/mirai/v1/team_pb';
import { Team, TeamMember, TeamRole } from '@/gen/mirai/v1/common_pb';

// Re-export types and enums
export { TeamRole };
export type { Team, TeamMember };

/**
 * Hook to list all teams for the current user's company.
 */
export function useListTeams() {
  const query = useQuery(listTeams, {});

  return {
    data: query.data?.teams ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get a single team by ID.
 */
export function useGetTeam(teamId: string | undefined) {
  const query = useQuery(
    getTeam,
    teamId ? { teamId } : undefined,
    { enabled: !!teamId }
  );

  return {
    data: query.data?.team,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to create a new team.
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();
  const mutation = useMutation(createTeam);

  return {
    mutate: async (data: {
      name: string;
      description?: string;
    }) => {
      const request = create(CreateTeamRequestSchema, {
        name: data.name,
        description: data.description,
      });

      const result = await mutation.mutateAsync(request);
      // Use type-safe cache invalidation
      await queryClient.invalidateQueries({
        queryKey: createConnectQueryKey({ schema: listTeams, cardinality: undefined }),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to update a team.
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();
  const mutation = useMutation(updateTeam);

  return {
    mutate: async (
      teamId: string,
      data: {
        name?: string;
        description?: string;
      }
    ) => {
      const request = create(UpdateTeamRequestSchema, {
        teamId,
        name: data.name,
        description: data.description,
      });

      const result = await mutation.mutateAsync(request);
      // Use type-safe cache invalidation for both list and individual queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: createConnectQueryKey({ schema: listTeams, cardinality: undefined }) }),
        queryClient.invalidateQueries({ queryKey: createConnectQueryKey({ schema: getTeam, cardinality: undefined }) }),
      ]);
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to delete a team.
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();
  const mutation = useMutation(deleteTeam);

  return {
    mutate: async (teamId: string) => {
      const request = create(DeleteTeamRequestSchema, { teamId });
      const result = await mutation.mutateAsync(request);
      // Use type-safe cache invalidation
      await queryClient.invalidateQueries({
        queryKey: createConnectQueryKey({ schema: listTeams, cardinality: undefined }),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to list members of a team.
 */
export function useListTeamMembers(teamId: string | undefined) {
  const query = useQuery(
    listTeamMembers,
    teamId ? { teamId } : undefined,
    { enabled: !!teamId }
  );

  return {
    data: query.data?.members ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to add a member to a team.
 */
export function useAddTeamMember() {
  const queryClient = useQueryClient();
  const mutation = useMutation(addTeamMember);

  return {
    mutate: async (data: {
      teamId: string;
      userId: string;
      role: TeamRole;
    }) => {
      const request = create(AddTeamMemberRequestSchema, {
        teamId: data.teamId,
        userId: data.userId,
        role: data.role,
      });

      const result = await mutation.mutateAsync(request);
      // Use type-safe cache invalidation
      await queryClient.invalidateQueries({
        queryKey: createConnectQueryKey({ schema: listTeamMembers, cardinality: undefined }),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to remove a member from a team.
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  const mutation = useMutation(removeTeamMember);

  return {
    mutate: async (data: {
      teamId: string;
      userId: string;
    }) => {
      const request = create(RemoveTeamMemberRequestSchema, {
        teamId: data.teamId,
        userId: data.userId,
      });

      const result = await mutation.mutateAsync(request);
      // Use type-safe cache invalidation
      await queryClient.invalidateQueries({
        queryKey: createConnectQueryKey({ schema: listTeamMembers, cardinality: undefined }),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
