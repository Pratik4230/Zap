import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  Button,
  Column,
  LazyColumn,
  ListItem,
  ModalBottomSheet,
  OutlinedTextField,
  PullToRefreshBox,
  Text,
  TextButton,
  useNativeState,
  type SnackbarHostRef,
} from "@expo/ui/jetpack-compose";
import {
  clickable,
  fillMaxSize,
  fillMaxWidth,
  padding,
} from "@expo/ui/jetpack-compose/modifiers";
import { apiClient } from "@/global/api/client";
import { getApiErrorMessage } from "@/global/api/errors";
import { queryKeys } from "@/global/api/query-keys";
import {
  canManageWebhooks,
  type WorkspaceListItem,
  type WorkspacePlan,
} from "@/global/api/types";
import { EmptyState, ErrorState, LoadingState } from "@/global/components/query-state";
import { toast } from "@/global/components/toast";
import { colors } from "@/global/theme";
import { openWebBilling } from "@/features/billing/open-web-billing";
import { validateProfileName } from "@/features/settings/utils/profile";
import { invalidateWorkspaceScoped } from "@/features/workspace/invalidate";
import { useWorkspace } from "@/features/workspace/use-workspace";
import { setWorkspaceId } from "@/features/workspace/workspace-id";
import { WorkspaceScreen } from "@/features/workspace/workspace-screen";

function planLabel(plan: WorkspacePlan) {
  if (plan === "business") return "Business";
  if (plan === "pro") return "Pro";
  return "Free";
}

function workspaceSupporting(item: WorkspaceListItem, currentId: string) {
  const bits = [planLabel(item.plan), item.role];
  if (item.id === currentId) bits.push("current");
  if (!item.usable) bits.push("upgrade to use");
  return bits.join(" · ");
}

export default function WorkspaceHubScreen() {
  const queryClient = useQueryClient();
  const snackbarRef = useRef<SnackbarHostRef>(null);
  const {
    data,
    current,
    limits,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    selectWorkspaceAsync,
  } = useWorkspace();

  const nameState = useNativeState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceListItem | null>(null);
  const [nameError, setNameError] = useState("");

  const workspaceId = current?.workspaceId ?? "";

  useEffect(() => {
    if (!workspaceId) return;
    void queryClient.prefetchQuery({
      queryKey: queryKeys.workspaceMembers(workspaceId),
      queryFn: () => apiClient.workspace.members(),
    });
    if (current?.plan === "business" && canManageWebhooks(current.role)) {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.workspaceWebhooks(workspaceId),
        queryFn: () => apiClient.workspace.webhooks.list(),
      });
    }
  }, [queryClient, workspaceId, current?.plan, current?.role]);

  const createMutation = useMutation({
    mutationFn: (name: string) => apiClient.workspace.create(name),
    onSuccess: async (workspace) => {
      await setWorkspaceId(workspace.id);
      setShowCreate(false);
      nameState.set("");
      await invalidateWorkspaceScoped(queryClient);
      void snackbarRef.current?.showSnackbar({
        message: `Created ${workspace.name}`,
        duration: "short",
      });
    },
    onError: (err) => {
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    },
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => apiClient.workspace.rename(name),
    onSuccess: async () => {
      setShowRename(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
      void snackbarRef.current?.showSnackbar({
        message: "Workspace renamed",
        duration: "short",
      });
    },
    onError: (err) => {
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.workspace.delete(id),
    onSuccess: async (result) => {
      await setWorkspaceId(result.workspaceId);
      setDeleteTarget(null);
      await invalidateWorkspaceScoped(queryClient);
      void snackbarRef.current?.showSnackbar({
        message: "Workspace deleted",
        duration: "short",
      });
    },
    onError: (err) => {
      setDeleteTarget(null);
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    },
  });

  function submitName(kind: "create" | "rename") {
    const next = nameState.get();
    const validation = validateProfileName(next);
    if (validation) {
      setNameError(validation);
      return;
    }
    setNameError("");
    if (kind === "create") createMutation.mutate(next.trim());
    else renameMutation.mutate(next.trim());
  }

  async function onSelect(item: WorkspaceListItem) {
    if (!item.usable || item.id === workspaceId) return;
    try {
      await selectWorkspaceAsync(item.id);
      void snackbarRef.current?.showSnackbar({
        message: `Switched to ${item.name}`,
        duration: "short",
      });
    } catch (err) {
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    }
  }

  const canCreate = Boolean(limits?.canCreate);
  const canDeleteOwned = (limits?.ownedCount ?? 0) > 1;

  return (
    <WorkspaceScreen
      embedded
      title="Workspaces"
      subtitle={
        current
          ? `You’re in ${current.workspaceName}`
          : "Manage spaces, team, and webhooks"
      }
      snackbarRef={snackbarRef}
    >
      {isPending && !data ? (
        <LoadingState padded message="Loading workspaces..." />
      ) : isError ? (
        <ErrorState
          padded
          message={getApiErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <PullToRefreshBox
          isRefreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentAlignment="topCenter"
          indicator={{
            color: colors.primary,
            containerColor: colors.background,
          }}
          modifiers={[fillMaxSize()]}
        >
          <LazyColumn
            verticalArrangement={{ spacedBy: 8 }}
            contentPadding={{ bottom: 18 }}
            modifiers={[fillMaxSize()]}
          >
            {current ? (
              <ListItem
                colors={{
                  containerColor: colors.surface,
                  contentColor: colors.foreground,
                  supportingContentColor: colors.muted,
                  overlineContentColor: colors.primary,
                }}
              >
                <ListItem.OverlineContent>
                  <Text style={{ fontSize: 11, fontWeight: "600" }}>CURRENT</Text>
                </ListItem.OverlineContent>
                <ListItem.HeadlineContent>
                  <Text style={{ fontSize: 18, fontWeight: "700" }} maxLines={1} overflow="ellipsis">
                    {current.workspaceName}
                  </Text>
                </ListItem.HeadlineContent>
                <ListItem.SupportingContent>
                  <Text>
                    {planLabel(current.plan)} · {current.role}
                  </Text>
                </ListItem.SupportingContent>
              </ListItem>
            ) : null}

            {current?.isOwner ? (
              <Button
                onClick={() => {
                  nameState.set(current.workspaceName);
                  setNameError("");
                  setShowRename(true);
                }}
                colors={{
                  containerColor: colors.surface,
                  contentColor: colors.foreground,
                }}
                modifiers={[fillMaxWidth()]}
              >
                <Text>Rename workspace</Text>
              </Button>
            ) : null}

            {current && current.plan !== "business" ? (
              <ListItem
                colors={{
                  containerColor: colors.surface,
                  contentColor: colors.foreground,
                  supportingContentColor: colors.muted,
                }}
                modifiers={[
                  clickable(() => {
                    void openWebBilling().catch((err) =>
                      toast(getApiErrorMessage(err), "error")
                    );
                  }),
                ]}
              >
                <ListItem.HeadlineContent>
                  <Text style={{ fontWeight: "600" }}>Upgrade to Business</Text>
                </ListItem.HeadlineContent>
                <ListItem.SupportingContent>
                  <Text>Extra workspaces, team seats, and webhooks</Text>
                </ListItem.SupportingContent>
              </ListItem>
            ) : null}

            {limits ? (
              <Text color={colors.muted} style={{ fontSize: 12 }}>
                {`${limits.ownedCount}/${limits.maxOwned} owned · ${limits.membershipCount}/${limits.maxMemberships} memberships`}
              </Text>
            ) : null}

            {canCreate ? (
              <Button
                onClick={() => {
                  nameState.set("");
                  setNameError("");
                  setShowCreate(true);
                }}
                colors={{
                  containerColor: colors.primary,
                  contentColor: colors.primaryForeground,
                }}
                modifiers={[fillMaxWidth()]}
              >
                <Text>New workspace</Text>
              </Button>
            ) : null}

            <Text color={colors.foreground} style={{ fontSize: 15, fontWeight: "700" }}>
              Your workspaces
            </Text>

            {(data?.workspaces ?? []).length === 0 ? (
              <EmptyState
                padded
                title="No workspaces"
                description="Create a workspace to start sharing links."
              />
            ) : (
              (data?.workspaces ?? []).map((item) => (
                <ListItem
                  key={item.id}
                  colors={{
                    containerColor:
                      item.id === workspaceId ? "#3d2a00" : colors.surface,
                    contentColor: colors.foreground,
                    supportingContentColor: colors.muted,
                    overlineContentColor: colors.primary,
                  }}
                  modifiers={[clickable(() => void onSelect(item))]}
                >
                  <ListItem.HeadlineContent>
                    <Text style={{ fontWeight: "600" }} maxLines={1} overflow="ellipsis">
                      {item.name}
                    </Text>
                  </ListItem.HeadlineContent>
                  <ListItem.SupportingContent>
                    <Text>{workspaceSupporting(item, workspaceId)}</Text>
                  </ListItem.SupportingContent>
                  {item.isOwner && canDeleteOwned ? (
                    <ListItem.TrailingContent>
                      <TextButton
                        enabled={!deleteMutation.isPending}
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Text>Delete</Text>
                      </TextButton>
                    </ListItem.TrailingContent>
                  ) : null}
                </ListItem>
              ))
            )}
          </LazyColumn>
        </PullToRefreshBox>
      )}

      {showCreate ? (
        <ModalBottomSheet
          onDismissRequest={() => setShowCreate(false)}
          containerColor={colors.surface}
          contentColor={colors.foreground}
          showDragHandle
        >
          <Column
            verticalArrangement={{ spacedBy: 12 }}
            modifiers={[fillMaxWidth(), padding(14, 14, 14, 14)]}
          >
            <Text style={{ fontSize: 20, fontWeight: "700" }}>New workspace</Text>
            <OutlinedTextField
              value={nameState}
              singleLine
              onValueChange={(value) => nameState.set(value)}
              modifiers={[fillMaxWidth()]}
            >
              <OutlinedTextField.Label>
                <Text>Name</Text>
              </OutlinedTextField.Label>
            </OutlinedTextField>
            {nameError ? (
              <Text color={colors.destructive} style={{ fontSize: 13 }}>
                {nameError}
              </Text>
            ) : null}
            <Button
              enabled={!createMutation.isPending}
              onClick={() => submitName("create")}
              colors={{
                containerColor: colors.primary,
                contentColor: colors.primaryForeground,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <Text>{createMutation.isPending ? "Saving…" : "Create"}</Text>
            </Button>
            <TextButton onClick={() => setShowCreate(false)}>
              <Text>Cancel</Text>
            </TextButton>
          </Column>
        </ModalBottomSheet>
      ) : null}

      {showRename ? (
        <ModalBottomSheet
          onDismissRequest={() => setShowRename(false)}
          containerColor={colors.surface}
          contentColor={colors.foreground}
          showDragHandle
        >
          <Column
            verticalArrangement={{ spacedBy: 12 }}
            modifiers={[fillMaxWidth(), padding(14, 14, 14, 14)]}
          >
            <Text style={{ fontSize: 20, fontWeight: "700" }}>Rename workspace</Text>
            <OutlinedTextField
              value={nameState}
              singleLine
              onValueChange={(value) => nameState.set(value)}
              modifiers={[fillMaxWidth()]}
            >
              <OutlinedTextField.Label>
                <Text>Name</Text>
              </OutlinedTextField.Label>
            </OutlinedTextField>
            {nameError ? (
              <Text color={colors.destructive} style={{ fontSize: 13 }}>
                {nameError}
              </Text>
            ) : null}
            <Button
              enabled={!renameMutation.isPending}
              onClick={() => submitName("rename")}
              colors={{
                containerColor: colors.primary,
                contentColor: colors.primaryForeground,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <Text>{renameMutation.isPending ? "Saving…" : "Save"}</Text>
            </Button>
            <TextButton onClick={() => setShowRename(false)}>
              <Text>Cancel</Text>
            </TextButton>
          </Column>
        </ModalBottomSheet>
      ) : null}

      {deleteTarget ? (
        <AlertDialog onDismissRequest={() => setDeleteTarget(null)}>
          <AlertDialog.Title>
            <Text>Delete {deleteTarget.name}?</Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <Text>
              Links in this workspace will be removed. You cannot delete your last owned workspace.
            </Text>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton
              enabled={!deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              <Text>Delete</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setDeleteTarget(null)}>
              <Text>Cancel</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}
    </WorkspaceScreen>
  );
}
