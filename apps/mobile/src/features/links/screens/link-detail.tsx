import { useMemo, useState } from "react";
import { Alert, Share, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Column,
  Host,
  OutlinedTextField,
  Row,
  Text,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, padding } from "@expo/ui/jetpack-compose/modifiers";
import { apiClient } from "@/global/api/client";
import { queryKeys } from "@/global/api/query-keys";
import type { LinkStatus } from "@/global/api/types";
import { getApiErrorMessage } from "@/global/api/errors";
import { colors } from "@/global/theme";
import {
  buildShortUrl,
  formatDateLabel,
  formatClickCount,
  statusLabel,
} from "@/features/links/utils/format";
import {
  findLinkInCache,
  removeLinkFromCache,
  upsertLinkInCache,
} from "@/features/links/utils/cache";

export default function LinkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const link = useMemo(() => (id ? findLinkInCache(queryClient, id) : undefined), [id, queryClient]);

  const titleState = useNativeState(link?.title ?? "");
  const destinationState = useNativeState(link?.destinationUrl ?? "");
  const expiresAtState = useNativeState(link?.expiresAt ?? "");
  const clickLimitState = useNativeState(link?.clickLimit != null ? String(link.clickLimit) : "");
  const passwordState = useNativeState("");

  const [serverError, setServerError] = useState("");

  const shortUrl = link ? buildShortUrl(link.domain, link.slug) : "";

  const updateMutation = useMutation({
    mutationFn: (nextStatus?: LinkStatus) => {
      if (!id) throw new Error("Invalid link id");
      const clickLimitRaw = clickLimitState.get().trim();
      const payload = {
        title: titleState.get().trim() || null,
        destinationUrl: destinationState.get().trim(),
        expiresAt: expiresAtState.get().trim() || null,
        clickLimit: clickLimitRaw === "" ? null : Number(clickLimitRaw),
        password: passwordState.get().trim() || undefined,
        status: nextStatus,
      };
      return apiClient.links.update(id, payload);
    },
    onSuccess: (updated) => {
      setServerError("");
      upsertLinkInCache(queryClient, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.links.summary });
      passwordState.set("");
    },
    onError: (error) => {
      setServerError(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Invalid link id");
      await apiClient.links.delete(id);
      return id;
    },
    onSuccess: (deletedId) => {
      removeLinkFromCache(queryClient, deletedId);
      queryClient.invalidateQueries({ queryKey: queryKeys.links.summary });
      router.back();
    },
    onError: (error) => {
      setServerError(getApiErrorMessage(error));
    },
  });

  async function onCopy() {
    if (!shortUrl) return;
    await Clipboard.setStringAsync(shortUrl);
  }

  async function onShare() {
    if (!shortUrl) return;
    await Share.share({ message: shortUrl, url: shortUrl });
  }

  function onDelete() {
    Alert.alert("Delete link", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteMutation.mutateAsync();
        },
      },
    ]);
  }

  if (!link || !id) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <Host colorScheme="dark" seedColor={colors.primary} style={{ flex: 1 }}>
          <Column
            verticalArrangement={{ spacedBy: 12 }}
            modifiers={[fillMaxWidth(), padding(20, 20, 20, 20)]}
          >
            <Text color={colors.foreground} style={{ fontSize: 22, fontWeight: "700" }}>
              Link not found
            </Text>
            <Text color={colors.muted}>
              Open link details from the Links list after loading data.
            </Text>
            <Button
              onClick={() => router.back()}
              colors={{
                containerColor: colors.primary,
                contentColor: colors.primaryForeground,
              }}
            >
              <Text>Back</Text>
            </Button>
          </Column>
        </Host>
      </View>
    );
  }

  const isBusy = updateMutation.isPending || deleteMutation.isPending;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Host colorScheme="dark" seedColor={colors.primary} style={{ flex: 1 }}>
        <Column
          verticalArrangement={{ spacedBy: 12 }}
          modifiers={[fillMaxWidth(), padding(20, 20, 20, 20)]}
        >
          <Text color={colors.primary} style={{ fontSize: 12, fontWeight: "700" }}>
            {statusLabel(link.status)}
          </Text>
          <Text color={colors.foreground} style={{ fontSize: 26, fontWeight: "700" }}>
            {link.title?.trim() || `${link.domain}/${link.slug}`}
          </Text>
          <Text color={colors.muted}>{shortUrl}</Text>
          <Text color={colors.muted}>
            {formatClickCount(link.clickCount)} clicks • {formatDateLabel(link.expiresAt)}
          </Text>

          <Row horizontalArrangement={{ spacedBy: 10 }} modifiers={[fillMaxWidth()]}>
            <Button
              enabled={!isBusy}
              modifiers={[fillMaxWidth(0.48)]}
              onClick={() => void onCopy()}
              colors={{
                containerColor: colors.surface,
                contentColor: colors.foreground,
              }}
            >
              <Text>Copy</Text>
            </Button>
            <Button
              enabled={!isBusy}
              modifiers={[fillMaxWidth()]}
              onClick={() => void onShare()}
              colors={{
                containerColor: colors.surface,
                contentColor: colors.foreground,
              }}
            >
              <Text>Share</Text>
            </Button>
          </Row>

          <Button
            enabled={!isBusy}
            onClick={() => router.push(`/links/${link.id}/analytics`)}
            colors={{
              containerColor: colors.surface,
              contentColor: colors.foreground,
            }}
            modifiers={[fillMaxWidth()]}
          >
            <Text>View analytics</Text>
          </Button>

          <OutlinedTextField value={titleState} singleLine enabled={!isBusy} modifiers={[fillMaxWidth()]}>
            <OutlinedTextField.Label>
              <Text>Title</Text>
            </OutlinedTextField.Label>
          </OutlinedTextField>

          <OutlinedTextField
            value={destinationState}
            singleLine
            enabled={!isBusy}
            keyboardOptions={{ keyboardType: "text", imeAction: "next" }}
            modifiers={[fillMaxWidth()]}
          >
            <OutlinedTextField.Label>
              <Text>Destination URL</Text>
            </OutlinedTextField.Label>
          </OutlinedTextField>

          <OutlinedTextField value={expiresAtState} singleLine enabled={!isBusy} modifiers={[fillMaxWidth()]}>
            <OutlinedTextField.Label>
              <Text>Expires At (ISO)</Text>
            </OutlinedTextField.Label>
          </OutlinedTextField>

          <OutlinedTextField
            value={clickLimitState}
            singleLine
            enabled={!isBusy}
            keyboardOptions={{ keyboardType: "number", imeAction: "next" }}
            modifiers={[fillMaxWidth()]}
          >
            <OutlinedTextField.Label>
              <Text>Click Limit</Text>
            </OutlinedTextField.Label>
          </OutlinedTextField>

          <OutlinedTextField
            value={passwordState}
            singleLine
            enabled={!isBusy}
            visualTransformation="password"
            modifiers={[fillMaxWidth()]}
          >
            <OutlinedTextField.Label>
              <Text>Password (leave blank to keep)</Text>
            </OutlinedTextField.Label>
          </OutlinedTextField>

          {serverError ? <Text color={colors.destructive}>{serverError}</Text> : null}

          <Button
            enabled={!isBusy}
            onClick={() => void updateMutation.mutateAsync(undefined)}
            colors={{
              containerColor: colors.primary,
              contentColor: colors.primaryForeground,
            }}
            modifiers={[fillMaxWidth()]}
          >
            <Text>{updateMutation.isPending ? "Saving..." : "Save changes"}</Text>
          </Button>

          <Row horizontalArrangement={{ spacedBy: 10 }} modifiers={[fillMaxWidth()]}>
            <Button
              enabled={!isBusy}
              modifiers={[fillMaxWidth(0.48)]}
              onClick={() =>
                void updateMutation.mutateAsync(link.status === "active" ? "paused" : "active")
              }
              colors={{
                containerColor: "#3d2a00",
                contentColor: colors.primary,
              }}
            >
              <Text>{link.status === "active" ? "Pause" : "Resume"}</Text>
            </Button>
            <Button
              enabled={!isBusy}
              modifiers={[fillMaxWidth()]}
              onClick={onDelete}
              colors={{
                containerColor: colors.destructive,
                contentColor: colors.foreground,
              }}
            >
              <Text>Delete</Text>
            </Button>
          </Row>

          <TextButton onClick={() => router.back()}>
            <Text color={colors.muted}>Back</Text>
          </TextButton>
        </Column>
      </Host>
    </View>
  );
}
