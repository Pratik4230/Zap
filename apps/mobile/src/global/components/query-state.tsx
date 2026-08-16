import { StyleSheet, Text, View } from "react-native";
import { Button, Column, ListItem, Text as ComposeText } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, padding } from "@expo/ui/jetpack-compose/modifiers";
import {
  BoltAnalyticsSkeleton,
  BoltLinkListSkeleton,
  BoltSpinner,
} from "@/global/components/bolt-skeleton";
import { useIsOnline } from "@/global/utils/network";
import { colors } from "@/global/theme";

type LoadingStateProps = {
  message?: string;
  padded?: boolean;
  variant?: "list" | "analytics" | "inline";
};

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  padded?: boolean;
};

type EmptyStateProps = {
  title: string;
  description?: string;
  padded?: boolean;
};

function padModifiers(padded?: boolean) {
  return padded ? [fillMaxWidth(), padding(14, 0, 14, 0)] : [fillMaxWidth()];
}

/** Shared bolt loading UI — RN-only so it can live inside Compose LazyColumn. */
export function LoadingState({
  message = "Loading...",
  padded,
  variant = "list",
}: LoadingStateProps) {
  return (
    <View
      style={[
        styles.container,
        padded ? styles.containerPadded : null,
      ]}
    >
      {variant === "analytics" ? (
        <BoltAnalyticsSkeleton />
      ) : variant === "inline" ? (
        <View style={styles.inline}>
          <BoltSpinner size={24} />
          <Text style={styles.message}>{message}</Text>
        </View>
      ) : (
        <>
          <BoltLinkListSkeleton rows={5} />
          {message ? <Text style={styles.listMessage}>{message}</Text> : null}
        </>
      )}
    </View>
  );
}

/** Shared error + optional retry (disabled while offline). */
export function ErrorState({ message, onRetry, padded }: ErrorStateProps) {
  const online = useIsOnline();
  const displayMessage = online
    ? message
    : "You’re offline. Reconnect and try again.";

  return (
    <Column
      verticalArrangement={{ spacedBy: 8 }}
      modifiers={padModifiers(padded)}
    >
      <ComposeText color={colors.destructive} style={{ fontSize: 13 }}>
        {displayMessage}
      </ComposeText>
      {onRetry ? (
        <Button
          enabled={online}
          onClick={onRetry}
          colors={{
            containerColor: colors.primary,
            contentColor: colors.primaryForeground,
          }}
          modifiers={[fillMaxWidth()]}
        >
          <ComposeText style={{ fontWeight: "600" }}>
            {online ? "Try again" : "Waiting for connection…"}
          </ComposeText>
        </Button>
      ) : null}
    </Column>
  );
}

/** Shared empty list / empty analytics block. */
export function EmptyState({ title, description, padded }: EmptyStateProps) {
  return (
    <ListItem
      colors={{
        containerColor: colors.surface,
        contentColor: colors.muted,
        supportingContentColor: colors.muted,
      }}
      modifiers={padModifiers(padded)}
    >
      <ListItem.HeadlineContent>
        <ComposeText>{title}</ComposeText>
      </ListItem.HeadlineContent>
      {description ? (
        <ListItem.SupportingContent>
          <ComposeText>{description}</ComposeText>
        </ListItem.SupportingContent>
      ) : null}
    </ListItem>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 4,
  },
  containerPadded: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inline: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  message: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
  },
  listMessage: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
