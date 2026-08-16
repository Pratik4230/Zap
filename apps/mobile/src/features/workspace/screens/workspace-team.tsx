import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  Button,
  Column,
  FilterChip,
  FlowRow,
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
import { fillMaxSize, fillMaxWidth, padding } from "@expo/ui/jetpack-compose/modifiers";
import { authClient } from "@/features/auth/utils/client";
import { apiClient } from "@/global/api/client";
import { getApiErrorMessage } from "@/global/api/errors";
import { queryKeys } from "@/global/api/query-keys";
import {
  canManageTeam,
  type WorkspaceInvite,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@/global/api/types";
import { EmptyState, ErrorState, LoadingState } from "@/global/components/query-state";
import { colors } from "@/global/theme";
import { invalidateWorkspaceScoped } from "@/features/workspace/invalidate";
import { useWorkspace } from "@/features/workspace/use-workspace";
import { WorkspaceScreen } from "@/features/workspace/workspace-screen";

type InviteRole = Exclude<WorkspaceRole, "owner">;

export default function WorkspaceTeamScreen() {
  const queryClient = useQueryClient();
  const snackbarRef = useRef<SnackbarHostRef>(null);
  const { data: session } = authClient.useSession();
  const { current, limits } = useWorkspace();
  const workspaceId = current?.workspaceId ?? "";
  const selfId = session?.user?.id ?? "";

  const emailState = useNativeState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState<InviteRole>("member");
  const [memberTarget, setMemberTarget] = useState<WorkspaceMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<WorkspaceInvite | null>(null);

  const membersQuery = useQuery({
    queryKey: queryKeys.workspaceMembers(workspaceId),
    enabled: Boolean(workspaceId),
    queryFn: () => apiClient.workspace.members(),
  });

  const data = membersQuery.data;
  const manage = Boolean(data && canManageTeam(data.workspace.role));
  const canLeave = (limits?.membershipCount ?? 0) > 1;

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiClient.workspace.invite(emailState.get().trim(), inviteRole),
    onSuccess: async () => {
      emailState.set("");
      setShowInvite(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceMembers(workspaceId),
      });
      void snackbarRef.current?.showSnackbar({
        message: "Invite sent",
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

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: InviteRole }) =>
      apiClient.workspace.updateMemberRole(userId, role),
    onSuccess: async () => {
      setMemberTarget(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceMembers(workspaceId),
      });
    },
    onError: (err) => {
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => apiClient.workspace.removeMember(userId),
    onSuccess: async (_ok, userId) => {
      setRemoveTarget(null);
      setMemberTarget(null);
      if (userId === selfId) {
        await invalidateWorkspaceScoped(queryClient);
      } else {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.workspaceMembers(workspaceId),
        });
      }
      void snackbarRef.current?.showSnackbar({
        message: userId === selfId ? "You left the workspace" : "Member removed",
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

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiClient.workspace.revokeInvite(id),
    onSuccess: async () => {
      setRevokeTarget(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceMembers(workspaceId),
      });
      void snackbarRef.current?.showSnackbar({
        message: "Invite revoked",
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

  return (
    <WorkspaceScreen
      embedded
      title="Team"
      subtitle={
        data
          ? `${data.seats.used} / ${data.seats.max} seats`
          : "Members and invitations"
      }
      snackbarRef={snackbarRef}
    >
      {membersQuery.isPending && !data ? (
        <LoadingState padded message="Loading team..." />
      ) : membersQuery.isError ? (
        <ErrorState
          padded
          message={getApiErrorMessage(membersQuery.error)}
          onRetry={() => void membersQuery.refetch()}
        />
      ) : data ? (
        <PullToRefreshBox
          isRefreshing={membersQuery.isRefetching}
          onRefresh={() => void membersQuery.refetch()}
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
            <Text color={colors.muted} style={{ fontSize: 12 }}>
              {`${data.seats.used}/${data.seats.max} seats used`}
            </Text>

            {manage ? (
              <Button
                onClick={() => setShowInvite(true)}
                colors={{
                  containerColor: colors.primary,
                  contentColor: colors.primaryForeground,
                }}
                modifiers={[fillMaxWidth()]}
              >
                <Text>Invite</Text>
              </Button>
            ) : null}

            {data.members.map((member) => (
              <ListItem
                key={member.userId}
                colors={{
                  containerColor: colors.surface,
                  contentColor: colors.foreground,
                  supportingContentColor: colors.muted,
                  overlineContentColor: colors.primary,
                }}
              >
                <ListItem.OverlineContent>
                  <Text style={{ fontSize: 11, fontWeight: "600" }}>
                    {member.role.toUpperCase()}
                  </Text>
                </ListItem.OverlineContent>
                <ListItem.HeadlineContent>
                  <Text style={{ fontWeight: "600" }} maxLines={1} overflow="ellipsis">
                    {member.name}
                  </Text>
                </ListItem.HeadlineContent>
                <ListItem.SupportingContent>
                  <Text>{member.email}</Text>
                </ListItem.SupportingContent>
                <ListItem.TrailingContent>
                  {member.userId === selfId && member.role !== "owner" && canLeave ? (
                    <Button
                      enabled={!removeMutation.isPending}
                      onClick={() => setRemoveTarget(member)}
                    >
                      <Text>Leave</Text>
                    </Button>
                  ) : manage && member.role !== "owner" ? (
                    <Button onClick={() => setMemberTarget(member)}>
                      <Text>Manage</Text>
                    </Button>
                  ) : null}
                </ListItem.TrailingContent>
              </ListItem>
            ))}

            {data.invites.length > 0 ? (
              <Text color={colors.foreground} style={{ fontSize: 15, fontWeight: "700" }}>
                Pending invites
              </Text>
            ) : null}

            {data.invites.map((invite) => (
              <ListItem
                key={invite.id}
                colors={{
                  containerColor: colors.surface,
                  contentColor: colors.foreground,
                  supportingContentColor: colors.muted,
                }}
              >
                <ListItem.HeadlineContent>
                  <Text maxLines={1} overflow="ellipsis">
                    {invite.email}
                  </Text>
                </ListItem.HeadlineContent>
                <ListItem.SupportingContent>
                  <Text>{invite.role}</Text>
                </ListItem.SupportingContent>
                {manage ? (
                  <ListItem.TrailingContent>
                    <Button onClick={() => setRevokeTarget(invite)}>
                      <Text>Revoke</Text>
                    </Button>
                  </ListItem.TrailingContent>
                ) : null}
              </ListItem>
            ))}

            {data.members.length === 0 ? (
              <EmptyState padded title="No members" />
            ) : null}
          </LazyColumn>
        </PullToRefreshBox>
      ) : null}

      {showInvite ? (
        <ModalBottomSheet
          onDismissRequest={() => setShowInvite(false)}
          containerColor={colors.surface}
          contentColor={colors.foreground}
          showDragHandle
        >
          <Column
            verticalArrangement={{ spacedBy: 12 }}
            modifiers={[fillMaxWidth(), padding(14, 14, 14, 14)]}
          >
            <Text style={{ fontSize: 20, fontWeight: "700" }}>Invite teammate</Text>
            <OutlinedTextField
              value={emailState}
              singleLine
              onValueChange={(value) => emailState.set(value)}
              keyboardOptions={{
                keyboardType: "email",
                capitalization: "none",
                autoCorrectEnabled: false,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <OutlinedTextField.Label>
                <Text>Email</Text>
              </OutlinedTextField.Label>
            </OutlinedTextField>
            <FlowRow horizontalArrangement={{ spacedBy: 8 }}>
              {(["member", "admin"] as const).map((role) => (
                <FilterChip
                  key={role}
                  selected={inviteRole === role}
                  onClick={() => setInviteRole(role)}
                >
                  <FilterChip.Label>
                    <Text>{role}</Text>
                  </FilterChip.Label>
                </FilterChip>
              ))}
            </FlowRow>
            <Button
              enabled={!inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
              colors={{
                containerColor: colors.primary,
                contentColor: colors.primaryForeground,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <Text>{inviteMutation.isPending ? "Sending…" : "Send invite"}</Text>
            </Button>
          </Column>
        </ModalBottomSheet>
      ) : null}

      {memberTarget ? (
        <ModalBottomSheet
          onDismissRequest={() => setMemberTarget(null)}
          containerColor={colors.surface}
          contentColor={colors.foreground}
          showDragHandle
        >
          <Column
            verticalArrangement={{ spacedBy: 10 }}
            modifiers={[fillMaxWidth(), padding(14, 14, 14, 14)]}
          >
            <Text style={{ fontSize: 20, fontWeight: "700" }}>{memberTarget.name}</Text>
            <Button
              enabled={!roleMutation.isPending && memberTarget.role !== "admin"}
              onClick={() =>
                roleMutation.mutate({ userId: memberTarget.userId, role: "admin" })
              }
              modifiers={[fillMaxWidth()]}
            >
              <Text>Make admin</Text>
            </Button>
            <Button
              enabled={!roleMutation.isPending && memberTarget.role !== "member"}
              onClick={() =>
                roleMutation.mutate({ userId: memberTarget.userId, role: "member" })
              }
              modifiers={[fillMaxWidth()]}
            >
              <Text>Make member</Text>
            </Button>
            <Button
              enabled={!removeMutation.isPending}
              onClick={() => setRemoveTarget(memberTarget)}
              colors={{
                containerColor: colors.destructive,
                contentColor: "#ffffff",
              }}
              modifiers={[fillMaxWidth()]}
            >
              <Text>Remove</Text>
            </Button>
          </Column>
        </ModalBottomSheet>
      ) : null}

      {removeTarget ? (
        <AlertDialog onDismissRequest={() => setRemoveTarget(null)}>
          <AlertDialog.Title>
            <Text>
              {removeTarget.userId === selfId ? "Leave workspace?" : `Remove ${removeTarget.name}?`}
            </Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <Text>
              {removeTarget.userId === selfId
                ? "You’ll switch back to a workspace you own."
                : "They will lose access to this workspace’s links."}
            </Text>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton
              enabled={!removeMutation.isPending}
              onClick={() => removeMutation.mutate(removeTarget.userId)}
            >
              <Text>{removeTarget.userId === selfId ? "Leave" : "Remove"}</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setRemoveTarget(null)}>
              <Text>Cancel</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}

      {revokeTarget ? (
        <AlertDialog onDismissRequest={() => setRevokeTarget(null)}>
          <AlertDialog.Title>
            <Text>Revoke invite?</Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <Text>{revokeTarget.email} will no longer be able to join with this invite.</Text>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton
              enabled={!revokeMutation.isPending}
              onClick={() => revokeMutation.mutate(revokeTarget.id)}
            >
              <Text>Revoke</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setRevokeTarget(null)}>
              <Text>Cancel</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}
    </WorkspaceScreen>
  );
}
