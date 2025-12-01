import { useQuery, useMutation } from '@connectrpc/connect-query';
import { useQueryClient } from '@tanstack/react-query';
import { create } from '@bufbuild/protobuf';
import {
  createSME,
  getSME,
  listSMEs,
  updateSME,
  deleteSME,
  createTask,
  getTask,
  listTasks,
  cancelTask,
  getUploadURL,
  submitContent,
  listSubmissions,
  getKnowledge,
} from '@/gen/mirai/v1/sme-SMEService_connectquery';
import {
  SMEScope,
  SMEStatus,
  SMETaskStatus,
  ContentType,
  type SubjectMatterExpert,
  type SMETask,
  type SMETaskSubmission,
  type SMEKnowledgeChunk,
  CreateSMERequestSchema,
  UpdateSMERequestSchema,
  DeleteSMERequestSchema,
  CreateTaskRequestSchema,
  CancelTaskRequestSchema,
  GetUploadURLRequestSchema,
  SubmitContentRequestSchema,
} from '@/gen/mirai/v1/sme_pb';

// Re-export types and enums
export { SMEScope, SMEStatus, SMETaskStatus, ContentType };
export type { SubjectMatterExpert, SMETask, SMETaskSubmission, SMEKnowledgeChunk };

/**
 * Hook to list all SMEs accessible to the current user.
 */
export function useListSMEs() {
  const query = useQuery(listSMEs, {});

  return {
    data: query.data?.smes ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get a single SME by ID.
 */
export function useGetSME(smeId: string | undefined) {
  const query = useQuery(
    getSME,
    smeId ? { smeId } : undefined,
    { enabled: !!smeId }
  );

  return {
    data: query.data?.sme,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to create a new SME.
 */
export function useCreateSME() {
  const queryClient = useQueryClient();
  const mutation = useMutation(createSME);

  return {
    mutate: async (data: {
      name: string;
      description?: string;
      domain: string;
      scope: SMEScope;
      teamIds?: string[];
    }) => {
      const request = create(CreateSMERequestSchema, {
        name: data.name,
        description: data.description,
        domain: data.domain,
        scope: data.scope,
        teamIds: data.teamIds ?? [],
      });

      const result = await mutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some((k) =>
            typeof k === 'string' && k.includes('listSMEs')
          ),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to update an SME.
 */
export function useUpdateSME() {
  const queryClient = useQueryClient();
  const mutation = useMutation(updateSME);

  return {
    mutate: async (
      smeId: string,
      data: {
        name?: string;
        description?: string;
        domain?: string;
        scope?: SMEScope;
      }
    ) => {
      const request = create(UpdateSMERequestSchema, {
        smeId,
        name: data.name,
        description: data.description,
        domain: data.domain,
        scope: data.scope,
      });

      const result = await mutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some((k) =>
            typeof k === 'string' && (k.includes('listSMEs') || k.includes('getSME'))
          ),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to delete an SME.
 */
export function useDeleteSME() {
  const queryClient = useQueryClient();
  const mutation = useMutation(deleteSME);

  return {
    mutate: async (smeId: string) => {
      const request = create(DeleteSMERequestSchema, { smeId });
      const result = await mutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some((k) =>
            typeof k === 'string' && k.includes('listSMEs')
          ),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to list tasks with optional filters.
 */
export function useListTasks(filters?: {
  smeId?: string;
  assignedToUserId?: string;
}) {
  const query = useQuery(listTasks, {
    smeId: filters?.smeId,
    assignedToUserId: filters?.assignedToUserId,
  });

  return {
    data: query.data?.tasks ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get a single task.
 */
export function useGetTask(taskId: string | undefined) {
  const query = useQuery(
    getTask,
    taskId ? { taskId } : undefined,
    { enabled: !!taskId }
  );

  return {
    data: query.data?.task,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to create a task.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const mutation = useMutation(createTask);

  return {
    mutate: async (data: {
      smeId: string;
      title: string;
      description?: string;
      expectedContentType?: ContentType;
      assignedToUserId: string;
      teamId?: string;
      dueDate?: Date;
    }) => {
      const request = create(CreateTaskRequestSchema, {
        smeId: data.smeId,
        title: data.title,
        description: data.description,
        expectedContentType: data.expectedContentType,
        assignedToUserId: data.assignedToUserId,
        teamId: data.teamId,
        dueDate: data.dueDate ? { seconds: BigInt(Math.floor(data.dueDate.getTime() / 1000)), nanos: 0 } : undefined,
      });

      const result = await mutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some((k) =>
            typeof k === 'string' && k.includes('listTasks')
          ),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to cancel a task.
 */
export function useCancelTask() {
  const queryClient = useQueryClient();
  const mutation = useMutation(cancelTask);

  return {
    mutate: async (taskId: string) => {
      const request = create(CancelTaskRequestSchema, { taskId });
      const result = await mutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some((k) =>
            typeof k === 'string' && (k.includes('listTasks') || k.includes('getTask'))
          ),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to get a presigned upload URL.
 */
export function useGetUploadURL() {
  const mutation = useMutation(getUploadURL);

  return {
    mutate: async (data: {
      taskId: string;
      fileName: string;
      contentType: ContentType;
    }) => {
      const request = create(GetUploadURLRequestSchema, {
        taskId: data.taskId,
        fileName: data.fileName,
        contentType: data.contentType,
      });

      return await mutation.mutateAsync(request);
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to submit content for a task.
 */
export function useSubmitContent() {
  const queryClient = useQueryClient();
  const mutation = useMutation(submitContent);

  return {
    mutate: async (data: {
      taskId: string;
      fileName: string;
      filePath: string;
      contentType: ContentType;
      fileSizeBytes: number;
    }) => {
      const request = create(SubmitContentRequestSchema, {
        taskId: data.taskId,
        fileName: data.fileName,
        filePath: data.filePath,
        contentType: data.contentType,
        fileSizeBytes: BigInt(data.fileSizeBytes),
      });

      const result = await mutation.mutateAsync(request);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some((k) =>
            typeof k === 'string' && (k.includes('listTasks') || k.includes('listSubmissions'))
          ),
      });
      return result;
    },
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to list submissions for a task.
 */
export function useListSubmissions(taskId: string | undefined) {
  const query = useQuery(
    listSubmissions,
    taskId ? { taskId } : undefined,
    { enabled: !!taskId }
  );

  return {
    data: query.data?.submissions ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get knowledge chunks for an SME.
 */
export function useGetKnowledge(smeId: string | undefined) {
  const query = useQuery(
    getKnowledge,
    smeId ? { smeId } : undefined,
    { enabled: !!smeId }
  );

  return {
    data: query.data?.chunks ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
