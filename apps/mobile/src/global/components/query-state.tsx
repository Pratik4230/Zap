import { Button, Column, ListItem, Text } from "@expo/ui/jetpack-compose";
import { fillMaxWidth, padding } from "@expo/ui/jetpack-compose/modifiers";
import { useIsOnline } from "@/global/utils/network";
import { colors } from "@/global/theme";

type LoadingStateProps = {
  message?: string;
  padded?: boolean;
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

/** Shared loading row for list / analytics screens. */
export function LoadingState({ message = "Loading...", padded }: LoadingStateProps) {
  return (
    <ListItem
      colors={{
        containerColor: colors.surface,
        contentColor: colors.muted,
      }}
      modifiers={padModifiers(padded)}
    >
      <ListItem.HeadlineContent>
        <Text>{message}</Text>
      </ListItem.HeadlineContent>
    </ListItem>
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
      <Text color={colors.destructive} style={{ fontSize: 13 }}>
        {displayMessage}
      </Text>
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
          <Text style={{ fontWeight: "600" }}>
            {online ? "Try again" : "Waiting for connection…"}
          </Text>
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
        <Text>{title}</Text>
      </ListItem.HeadlineContent>
      {description ? (
        <ListItem.SupportingContent>
          <Text>{description}</Text>
        </ListItem.SupportingContent>
      ) : null}
    </ListItem>
  );
}
