import { ListItem, Text } from "@expo/ui/jetpack-compose";
import { clickable } from "@expo/ui/jetpack-compose/modifiers";
import type { DashboardLink } from "@/global/api/types";
import { colors } from "@/global/theme";
import { formatClickCount, statusLabel } from "@/features/links/utils/format";

type LinkRowProps = {
  link: DashboardLink;
  onPress?: (link: DashboardLink) => void;
};

function statusColor(status: DashboardLink["status"]) {
  switch (status) {
    case "active":
      return colors.primary;
    case "paused":
      return colors.warning;
    case "expired":
      return colors.muted;
  }
}

export function LinkRow({ link, onPress }: LinkRowProps) {
  const shortPath = `${link.domain}/${link.slug}`;
  const title = link.title?.trim() || shortPath;

  return (
    <ListItem
      colors={{
        containerColor: colors.surface,
        contentColor: colors.foreground,
        supportingContentColor: colors.muted,
        overlineContentColor: statusColor(link.status),
        trailingContentColor: colors.muted,
      }}
      modifiers={onPress ? [clickable(() => onPress(link))] : undefined}
    >
      <ListItem.OverlineContent>
        <Text style={{ fontSize: 11, fontWeight: "600" }}>
          {statusLabel(link.status)}
        </Text>
      </ListItem.OverlineContent>
      <ListItem.HeadlineContent>
        <Text
          style={{ fontSize: 16, fontWeight: "600" }}
          maxLines={1}
          overflow="ellipsis"
        >
          {title}
        </Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Text style={{ fontSize: 13 }} maxLines={1} overflow="ellipsis">
          {link.title?.trim() ? shortPath : link.destinationUrl}
        </Text>
      </ListItem.SupportingContent>
      <ListItem.TrailingContent>
        <Text style={{ fontSize: 13, fontWeight: "600" }}>
          {formatClickCount(link.clickCount)}
        </Text>
      </ListItem.TrailingContent>
    </ListItem>
  );
}
