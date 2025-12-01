import { useQuery, useMutation } from '@connectrpc/connect-query';
import { useQueryClient } from '@tanstack/react-query';
import { create } from '@bufbuild/protobuf';
import {
  createTemplate,
  getTemplate,
  listTemplates,
  updateTemplate,
  deleteTemplate,
} from '@/gen/mirai/v1/target_audience-TargetAudienceService_connectquery';
import {
  ExperienceLevel,
  type TargetAudienceTemplate,
  CreateTemplateRequestSchema,
  UpdateTemplateRequestSchema,
  DeleteTemplateRequestSchema,
} from '@/gen/mirai/v1/target_audience_pb';

// Re-export types and enums
export { ExperienceLevel };
export type { TargetAudienceTemplate };

/**
 * Hook to list all target audience templates.
 */
export function useListTargetAudiences() {
  const query = useQuery(listTemplates, {});

  return {
    data: query.data?.templates ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get a single target audience template.
 */
export function useGetTargetAudience(templateId: string | undefined) {
  const query = useQuery(
    getTemplate,
    templateId ? { templateId } : undefined,
    { enabled: !!templateId }
  );

  return {
    data: query.data?.template,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to create a target audience template.
 */
export function useCreateTargetAudience() {
  const queryClient = useQueryClient();
  const mutation = useMutation(createTemplate);

  return {
    mutate: async (data: {
      name: string;
      description?: string;
      role: string;
      experienceLevel: ExperienceLevel;
      learningGoals?: string[];
      prerequisites?: string[];
      challenges?: string[];
      motivations?: string[];
      industryContext?: string;
      typicalBackground?: string;
    }) => {
      const request = create(CreateTemplateRequestSchema, {
        name: data.name,
        description: data.description,
        role: data.role,
        experienceLevel: data.experienceLevel,
        learningGoals: data.learningGoals ?? [],
        prerequisites: data.prerequisites ?? [],
        challenges: data.challenges ?? [],
        motivations: data.motivations ?? [],
        industryContext: data.industryContext,
        typicalBackground: data.typicalBackground,
      });

      const result = await mutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some((k) =>
            typeof k === 'string' && k.includes('listTemplates')
          ),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to update a target audience template.
 */
export function useUpdateTargetAudience() {
  const queryClient = useQueryClient();
  const mutation = useMutation(updateTemplate);

  return {
    mutate: async (
      templateId: string,
      data: {
        name?: string;
        description?: string;
        role?: string;
        experienceLevel?: ExperienceLevel;
        learningGoals?: string[];
        prerequisites?: string[];
        challenges?: string[];
        motivations?: string[];
        industryContext?: string;
        typicalBackground?: string;
      }
    ) => {
      const request = create(UpdateTemplateRequestSchema, {
        templateId,
        name: data.name,
        description: data.description,
        role: data.role,
        experienceLevel: data.experienceLevel,
        learningGoals: data.learningGoals,
        prerequisites: data.prerequisites,
        challenges: data.challenges,
        motivations: data.motivations,
        industryContext: data.industryContext,
        typicalBackground: data.typicalBackground,
      });

      const result = await mutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some((k) =>
            typeof k === 'string' && (k.includes('listTemplates') || k.includes('getTemplate'))
          ),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to delete a target audience template.
 */
export function useDeleteTargetAudience() {
  const queryClient = useQueryClient();
  const mutation = useMutation(deleteTemplate);

  return {
    mutate: async (templateId: string) => {
      const request = create(DeleteTemplateRequestSchema, { templateId });
      const result = await mutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some((k) =>
            typeof k === 'string' && k.includes('listTemplates')
          ),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
