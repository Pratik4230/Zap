import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  Button,
  Column,
  FilterChip,
  FlowRow,
  LazyColumn,
  ListItem,
  OutlinedTextField,
  Switch,
  Text,
  TextButton,
  useNativeState,
  type SnackbarHostRef,
} from "@expo/ui/jetpack-compose";
import { fillMaxSize, fillMaxWidth, padding } from "@expo/ui/jetpack-compose/modifiers";
import { apiClient } from "@/global/api/client";
import { getApiErrorMessage } from "@/global/api/errors";
import { queryKeys } from "@/global/api/query-keys";
import { WEBHOOK_EVENTS, type WebhookEvent } from "@/global/api/types";
import { EmptyState, ErrorState, LoadingState } from "@/global/components/query-state";
import { colors } from "@/global/theme";
import { useWorkspace } from "@/features/workspace/use-workspace";
import {
  forgetWebhookSecret,
  peekWebhookSecret,
  rememberWebhookSecret,
} from "@/features/workspace/webhook-secrets";
import { WorkspaceScreen } from "@/features/workspace/workspace-screen";

export default function WorkspaceWebhookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const snackbarRef = useRef<SnackbarHostRef>(null);
  const { current } = useWorkspace();
  const workspaceId = current?.workspaceId ?? "";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  const listQuery = useQuery({
    queryKey: queryKeys.workspaceWebhooks(workspaceId),
    enabled: Boolean(workspaceId),
    queryFn: () => apiClient.workspace.webhooks.list(),
  });

  const hook = listQuery.data?.webhooks.find((item) => item.id === id);
  const urlState = useNativeState("");
  const [events, setEvents] = useState<WebhookEvent[]>([...WEBHOOK_EVENTS]);
  const secret = id ? peekWebhookSecret(id) : undefined;

  useEffect(() => {
    if (!hook) return;
    urlState.set(hook.url);
    setEvents(hook.events);
  }, [hook?.id]);

  const eventOptions = listQuery.data?.events ?? WEBHOOK_EVENTS;

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.workspace.webhooks.update(id as string, {
        url: urlState.get().trim(),
        events,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceWebhooks(workspaceId),
      });
      void snackbarRef.current?.showSnackbar({
        message: "Webhook saved",
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

  const enabledMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiClient.workspace.webhooks.update(id as string, { enabled }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceWebhooks(workspaceId),
      });
    },
    onError: (err) => {
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: () => apiClient.workspace.webhooks.rotate(id as string),
    onSuccess: async (nextSecret) => {
      if (id) rememberWebhookSecret(id, nextSecret);
      setConfirmRotate(false);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceWebhooks(workspaceId),
      });
      void snackbarRef.current?.showSnackbar({
        message: "Secret rotated — copy it now",
        duration: "long",
      });
    },
    onError: (err) => {
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: () => apiClient.workspace.webhooks.test(id as string),
    onSuccess: () => {
      void snackbarRef.current?.showSnackbar({
        message: "Test event sent",
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
    mutationFn: () => apiClient.workspace.webhooks.delete(id as string),
    onSuccess: async () => {
      if (id) forgetWebhookSecret(id);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.workspaceWebhooks(workspaceId),
      });
      router.back();
    },
    onError: (err) => {
      void snackbarRef.current?.showSnackbar({
        message: getApiErrorMessage(err),
        duration: "long",
      });
    },
  });

  const lastError = hook?.lastError;
  const supporting = useMemo(() => {
    if (!hook) return "";
    if (hook.lastError) return hook.lastError;
    if (hook.lastDeliveredAt) return `Last delivery ${hook.lastDeliveredAt}`;
    return "No deliveries yet";
  }, [hook]);

  function toggleEvent(event: WebhookEvent) {
    setEvents((currentEvents) =>
      currentEvents.includes(event)
        ? currentEvents.filter((item) => item !== event)
        : [...currentEvents, event]
    );
  }

  async function copySecret() {
    if (!secret) return;
    await Clipboard.setStringAsync(secret);
    void snackbarRef.current?.showSnackbar({
      message: "Secret copied",
      duration: "short",
    });
  }

  return (
    <WorkspaceScreen title="Webhook" subtitle={hook?.url} snackbarRef={snackbarRef}>
      {listQuery.isPending && !hook ? (
        <LoadingState padded message="Loading webhook..." />
      ) : listQuery.isError ? (
        <ErrorState
          padded
          message={getApiErrorMessage(listQuery.error)}
          onRetry={() => void listQuery.refetch()}
        />
      ) : !hook ? (
        <EmptyState padded title="Webhook not found" />
      ) : (
        <LazyColumn
          verticalArrangement={{ spacedBy: 10 }}
          contentPadding={{ bottom: 24 }}
          modifiers={[fillMaxSize()]}
        >
          <ListItem
            colors={{
              containerColor: colors.surface,
              contentColor: colors.foreground,
              supportingContentColor: lastError ? colors.destructive : colors.muted,
            }}
          >
            <ListItem.HeadlineContent>
              <Text style={{ fontWeight: "600" }}>Delivery</Text>
            </ListItem.HeadlineContent>
            <ListItem.SupportingContent>
              <Text>{supporting}</Text>
            </ListItem.SupportingContent>
            <ListItem.TrailingContent>
              <Switch
                value={hook.enabled}
                enabled={!enabledMutation.isPending}
                onCheckedChange={(value) => enabledMutation.mutate(value)}
              />
            </ListItem.TrailingContent>
          </ListItem>

          <OutlinedTextField
            value={urlState}
            singleLine
            onValueChange={(value) => urlState.set(value)}
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
            {eventOptions.map((event) => (
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

          {secret ? (
            <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
              <Text color={colors.muted} style={{ fontSize: 13 }}>
                Signing secret (shown once)
              </Text>
              <Text style={{ fontSize: 13 }}>{secret}</Text>
              <Button onClick={() => void copySecret()} modifiers={[fillMaxWidth()]}>
                <Text>Copy secret</Text>
              </Button>
            </Column>
          ) : (
            <Text color={colors.muted} style={{ fontSize: 13 }}>
              The signing secret is only shown after create or rotate.
            </Text>
          )}

          <Button
            enabled={!saveMutation.isPending && events.length > 0}
            onClick={() => saveMutation.mutate()}
            colors={{
              containerColor: colors.primary,
              contentColor: colors.primaryForeground,
            }}
            modifiers={[fillMaxWidth()]}
          >
            <Text>{saveMutation.isPending ? "Saving…" : "Save"}</Text>
          </Button>
          <Button
            enabled={!testMutation.isPending}
            onClick={() => testMutation.mutate()}
            modifiers={[fillMaxWidth()]}
          >
            <Text>{testMutation.isPending ? "Sending…" : "Send test event"}</Text>
          </Button>
          <Button
            enabled={!rotateMutation.isPending}
            onClick={() => setConfirmRotate(true)}
            modifiers={[fillMaxWidth()]}
          >
            <Text>Rotate secret</Text>
          </Button>
          <Button
            enabled={!deleteMutation.isPending}
            onClick={() => setConfirmDelete(true)}
            colors={{
              containerColor: colors.destructive,
              contentColor: "#ffffff",
            }}
            modifiers={[fillMaxWidth()]}
          >
            <Text>Delete webhook</Text>
          </Button>
        </LazyColumn>
      )}

      {confirmRotate ? (
        <AlertDialog onDismissRequest={() => setConfirmRotate(false)}>
          <AlertDialog.Title>
            <Text>Rotate secret?</Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <Text>The previous secret stops working immediately.</Text>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton
              enabled={!rotateMutation.isPending}
              onClick={() => rotateMutation.mutate()}
            >
              <Text>Rotate</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setConfirmRotate(false)}>
              <Text>Cancel</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}

      {confirmDelete ? (
        <AlertDialog onDismissRequest={() => setConfirmDelete(false)}>
          <AlertDialog.Title>
            <Text>Delete webhook?</Text>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <Text>This endpoint will stop receiving events.</Text>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton
              enabled={!deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              <Text>Delete</Text>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setConfirmDelete(false)}>
              <Text>Cancel</Text>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      ) : null}
    </WorkspaceScreen>
  );
}
