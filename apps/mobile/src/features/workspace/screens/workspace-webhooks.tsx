import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
  WEBHOOK_EVENTS,
  canManageWebhooks,
  type WebhookEvent,
} from "@/global/api/types";
import { EmptyState, ErrorState, LoadingState } from "@/global/components/query-state";
import { colors } from "@/global/theme";
import { useWorkspace } from "@/features/workspace/use-workspace";
import { rememberWebhookSecret } from "@/features/workspace/webhook-secrets";
import { WorkspaceScreen } from "@/features/workspace/workspace-screen";

export default function WorkspaceWebhooksScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const snackbarRef = useRef<SnackbarHostRef>(null);
  const { current } = useWorkspace();
  const workspaceId = current?.workspaceId ?? "";
  const urlState = useNativeState("");
  const [showCreate, setShowCreate] = useState(false);
  const [events, setEvents] = useState<WebhookEvent[]>([...WEBHOOK_EVENTS]);

  const allowed =
    current?.plan === "business" && current && canManageWebhooks(current.role);

  const query = useQuery({
    queryKey: queryKeys.workspaceWebhooks(workspaceId),
    enabled: Boolean(workspaceId) && Boolean(allowed),
    queryFn: () => apiClient.workspace.webhooks.list(),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.workspace.webhooks.create({
        url: urlState.get().trim(),
        events,
      }),
    onSuccess: async (webhook) => {
      if (webhook.secret) rememberWebhookSecret(webhook.id, webhook.secret);
      urlState.set("");
      setShowCreate(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceWebhooks(workspaceId),
      });
      void snackbarRef.current?.showSnackbar({
        message: "Webhook created — copy the secret now",
        duration: "long",
      });
      router.push(`/workspaces/webhooks/${webhook.id}`);
    },
    onError: (err) => {
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    },
  });

  function toggleEvent(event: WebhookEvent) {
    setEvents((currentEvents) =>
      currentEvents.includes(event)
        ? currentEvents.filter((item) => item !== event)
        : [...currentEvents, event]
    );
  }

  return (
    <WorkspaceScreen
      embedded
      title="Webhooks"
      subtitle="HTTPS callbacks for link events"
      snackbarRef={snackbarRef}
    >
      {!allowed ? (
        <EmptyState
          padded
          title="Business only"
          description="Webhooks need the Business plan and an owner or admin role."
        />
      ) : query.isPending && !query.data ? (
        <LoadingState padded message="Loading webhooks..." />
      ) : query.isError ? (
        <ErrorState
          padded
          message={getApiErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <PullToRefreshBox
          isRefreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
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
            <Button
              onClick={() => {
                setEvents([...(query.data?.events ?? WEBHOOK_EVENTS)]);
                setShowCreate(true);
              }}
              colors={{
                containerColor: colors.primary,
                contentColor: colors.primaryForeground,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <Text>Add webhook</Text>
            </Button>

            {(query.data?.webhooks ?? []).length === 0 ? (
              <EmptyState
                padded
                title="No webhooks"
                description="Add an HTTPS endpoint to receive link events."
              />
            ) : (
              (query.data?.webhooks ?? []).map((hook) => (
                <ListItem
                  key={hook.id}
                  colors={{
                    containerColor: colors.surface,
                    contentColor: colors.foreground,
                    supportingContentColor: colors.muted,
                    overlineContentColor: hook.enabled ? colors.primary : colors.muted,
                  }}
                  modifiers={[
                    clickable(() => router.push(`/workspaces/webhooks/${hook.id}`)),
                  ]}
                >
                  <ListItem.OverlineContent>
                    <Text style={{ fontSize: 11, fontWeight: "600" }}>
                      {hook.enabled ? "ENABLED" : "PAUSED"}
                    </Text>
                  </ListItem.OverlineContent>
                  <ListItem.HeadlineContent>
                    <Text maxLines={1} overflow="ellipsis">
                      {hook.url}
                    </Text>
                  </ListItem.HeadlineContent>
                  <ListItem.SupportingContent>
                    <Text>{hook.events.join(", ")}</Text>
                  </ListItem.SupportingContent>
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
            <Text style={{ fontSize: 20, fontWeight: "700" }}>New webhook</Text>
            <OutlinedTextField
              value={urlState}
              singleLine
              onValueChange={(value) => urlState.set(value)}
              keyboardOptions={{
                keyboardType: "text",
                capitalization: "none",
                autoCorrectEnabled: false,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <OutlinedTextField.Label>
                <Text>HTTPS URL</Text>
              </OutlinedTextField.Label>
            </OutlinedTextField>
            <FlowRow
              horizontalArrangement={{ spacedBy: 8 }}
              verticalArrangement={{ spacedBy: 8 }}
            >
              {(query.data?.events ?? WEBHOOK_EVENTS).map((event) => (
                <FilterChip
                  key={event}
                  selected={events.includes(event)}
                  onClick={() => toggleEvent(event)}
                >
                  <FilterChip.Label>
                    <Text>{event}</Text>
                  </FilterChip.Label>
                </FilterChip>
              ))}
            </FlowRow>
            <Button
              enabled={!createMutation.isPending && events.length > 0}
              onClick={() => createMutation.mutate()}
              colors={{
                containerColor: colors.primary,
                contentColor: colors.primaryForeground,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <Text>{createMutation.isPending ? "Creating…" : "Create"}</Text>
            </Button>
          </Column>
        </ModalBottomSheet>
      ) : null}
    </WorkspaceScreen>
  );
}
