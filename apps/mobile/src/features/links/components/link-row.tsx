import { Icon, IconButton, ListItem, Row, Text } from "@expo/ui/jetpack-compose";
import { combinedClickable } from "@expo/ui/jetpack-compose/modifiers";
import MoreVertIcon from "@expo/material-symbols/more_vert.xml";
import type { DashboardLink } from "@/global/api/types";
import { colors } from "@/global/theme";
import { formatClickCount, statusLabel } from "@/features/links/utils/format";

type LinkRowProps = {
  link: DashboardLink;
  onPress?: (link: DashboardLink) => void;
  onManage?: (link: DashboardLink) => void;
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

export function LinkRow({ link, onPress, onManage }: LinkRowProps) {
  const shortPath = `${link.domain}/${link.slug}`;
  const title = link.title?.trim() || shortPath;
  const isInteractive = Boolean(onPress || onManage);

  return (
    <ListItem
      colors={{
        containerColor: colors.surface,
        contentColor: colors.foreground,
        supportingContentColor: colors.muted,
        overlineContentColor: statusColor(link.status),
        trailingContentColor: colors.muted,
      }}
      modifiers={
        isInteractive
          ? [
              combinedClickable({
                onClick: onPress ? () => onPress(link) : undefined,
                onLongClick: onManage ? () => onManage(link) : undefined,
              }),
            ]
          : undefined
      }
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
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 2 }}>
          <Text style={{ fontSize: 13, fontWeight: "600" }}>
            {formatClickCount(link.clickCount)}
          </Text>
          {onManage ? (
            <IconButton
              onClick={() => onManage(link)}
              colors={{
                containerColor: "transparent",
                contentColor: colors.muted,
              }}
            >
              <Icon source={MoreVertIcon} size={20} tint={colors.muted} />
            </IconButton>
          ) : null}
        </Row>
      </ListItem.TrailingContent>
    </ListItem>
  );
}
