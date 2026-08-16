import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/features/auth/utils/client";
import { apiClient } from "@/global/api/client";
import { queryKeys } from "@/global/api/query-keys";
import type { WorkspaceResponse } from "@/global/api/types";
import {
  getWorkspaceIdSync,
  setWorkspaceId,
} from "@/features/workspace/workspace-id";
import { invalidateWorkspaceScoped } from "@/features/workspace/invalidate";

function currentFromList(
  data: WorkspaceResponse,
  workspaceId: string
): WorkspaceResponse["current"] | null {
  const item = data.workspaces.find((workspace) => workspace.id === workspaceId);
  if (!item) return null;
  return {
    workspaceId: item.id,
    workspaceName: item.name,
    plan: item.plan,
    role: item.role,
    isOwner: item.isOwner,
  };
}

export function useWorkspace() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const query = useQuery({
    queryKey: queryKeys.workspace,
    enabled: Boolean(session?.user),
    staleTime: 20_000,
    queryFn: async () => {
      const data = await apiClient.workspace.get();
      const usable = data.workspaces.filter((workspace) => workspace.usable);
      const stored = getWorkspaceIdSync();
      const match = usable.find((workspace) => workspace.id === stored);
      const nextId = match?.id ?? data.current.workspaceId;
      if (nextId && nextId !== stored) {
        await setWorkspaceId(nextId);
      }
      return data;
    },
  });

  const selectMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      const previousId = getWorkspaceIdSync();
      const previous = queryClient.getQueryData<WorkspaceResponse>(
        queryKeys.workspace
      );

      await setWorkspaceId(workspaceId);
      if (previous) {
        const nextCurrent = currentFromList(previous, workspaceId);
        if (nextCurrent) {
          queryClient.setQueryData<WorkspaceResponse>(queryKeys.workspace, {
            ...previous,
            current: nextCurrent,
          });
        }
      }
      try {
        await apiClient.workspace.select(workspaceId);
        await invalidateWorkspaceScoped(queryClient);
      } catch (error) {
        await setWorkspaceId(previousId);
        if (previous) {
          queryClient.setQueryData(queryKeys.workspace, previous);
        }
        throw error;
      }
    },
  });

  const usable =
    query.data?.workspaces.filter((workspace) => workspace.usable) ?? [];

  return {
    ...query,
    usable,
    current: query.data?.current,
    limits: query.data?.limits,
    selectWorkspace: selectMutation.mutate,
    selectWorkspaceAsync: selectMutation.mutateAsync,
    isSelecting: selectMutation.isPending,
    selectError: selectMutation.error,
  };
}
