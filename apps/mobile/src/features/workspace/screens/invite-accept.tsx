import { useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Column,
  Text,
  type SnackbarHostRef,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, padding } from "@expo/ui/jetpack-compose/modifiers";
import { apiClient } from "@/global/api/client";
import { getApiErrorMessage } from "@/global/api/errors";
import { queryKeys } from "@/global/api/query-keys";
import { ErrorState, LoadingState } from "@/global/components/query-state";
import { colors } from "@/global/theme";
import { invalidateWorkspaceScoped } from "@/features/workspace/invalidate";
import { setWorkspaceId } from "@/features/workspace/workspace-id";
import { WorkspaceScreen } from "@/features/workspace/workspace-screen";

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const snackbarRef = useRef<SnackbarHostRef>(null);

  const previewQuery = useQuery({
    queryKey: queryKeys.invite(token ?? ""),
    enabled: Boolean(token),
    queryFn: () => apiClient.invite.preview(token as string),
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => apiClient.invite.accept(token as string),
    onSuccess: async (result) => {
      await setWorkspaceId(result.workspaceId);
      await invalidateWorkspaceScoped(queryClient);
      router.replace("/workspace");
    },
    onError: (err) => {
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    },
  });

  const preview = previewQuery.data;

  return (
    <WorkspaceScreen
      title="Workspace invite"
      subtitle={preview?.workspaceName ?? "Join a team workspace"}
      snackbarRef={snackbarRef}
    >
      {previewQuery.isPending ? (
        <LoadingState padded message="Loading invite..." />
      ) : previewQuery.isError ? (
        <ErrorState
          padded
          message={getApiErrorMessage(previewQuery.error)}
          onRetry={() => void previewQuery.refetch()}
        />
      ) : preview ? (
        <Column
          verticalArrangement={{ spacedBy: 12 }}
          modifiers={[fillMaxWidth(), padding(4, 0, 4, 0)]}
        >
          <Text style={{ fontSize: 16, fontWeight: "600" }}>
            {preview.workspaceName}
          </Text>
          <Text color={colors.muted} style={{ fontSize: 14 }}>
            Invited as {preview.role} · {preview.email}
          </Text>
          {!preview.matchesAccount ? (
            <Text color={colors.destructive} style={{ fontSize: 13 }}>
              Sign in as {preview.email} to accept this invite.
            </Text>
          ) : null}
          <Button
            enabled={preview.matchesAccount && !acceptMutation.isPending}
            onClick={() => acceptMutation.mutate()}
            colors={{
              containerColor: colors.primary,
              contentColor: colors.primaryForeground,
            }}
            modifiers={[fillMaxWidth()]}
          >
            <Text>{acceptMutation.isPending ? "Joining…" : "Accept invite"}</Text>
          </Button>
        </Column>
      ) : null}
    </WorkspaceScreen>
  );
}
