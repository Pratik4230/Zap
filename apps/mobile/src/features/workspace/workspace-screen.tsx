import type { ReactNode, RefObject } from "react";
import { useRouter } from "expo-router";
import {
  Box,
  Column,
  Host,
  Icon,
  IconButton,
  Snackbar,
  SnackbarHost,
  Text,
  type SnackbarHostRef,
} from "@expo/ui/jetpack-compose";
import {
  align,
  fillMaxSize,
  fillMaxWidth,
  padding,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import ArrowBackIcon from "@expo/material-symbols/arrow_back.xml";
import { ScreenShell } from "@/global/components/screen-shell";
import { colors } from "@/global/theme";

type WorkspaceScreenProps = {
  title: string;
  subtitle?: string;
  snackbarRef?: RefObject<SnackbarHostRef | null>;
  trailing?: ReactNode;
  /** Tab scenes already have a top tab bar — hide back and skip extra top inset. */
  embedded?: boolean;
  children: ReactNode;
};

function BackButton() {
  const router = useRouter();
  return (
    <IconButton
      onClick={() => router.back()}
      colors={{
        containerColor: colors.surface,
        contentColor: colors.foreground,
      }}
    >
      <Icon source={ArrowBackIcon} size={22} tint={colors.foreground} />
    </IconButton>
  );
}

export function WorkspaceScreen({
  title,
  subtitle,
  snackbarRef,
  trailing,
  embedded = false,
  children,
}: WorkspaceScreenProps) {
  return (
    <ScreenShell edges={embedded ? [] : ["top", "bottom"]}>
      <Host
        colorScheme="dark"
        seedColor={colors.primary}
        style={{ flex: 1, width: "100%" }}
      >
        <Box modifiers={[fillMaxSize()]}>
          <Column
            modifiers={[fillMaxSize(), fillMaxWidth(), padding(14, 8, 14, 8)]}
            verticalArrangement={{ spacedBy: 10 }}
          >
            {embedded ? null : (
              <Column
                horizontalAlignment="start"
                verticalArrangement={{ spacedBy: 6 }}
                modifiers={[fillMaxWidth()]}
              >
                <BackButton />
                <Text
                  color={colors.foreground}
                  style={{ fontSize: 24, fontWeight: "700" }}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text color={colors.muted} style={{ fontSize: 13 }}>
                    {subtitle}
                  </Text>
                ) : null}
                {trailing}
              </Column>
            )}
            {embedded && subtitle ? (
              <Text color={colors.muted} style={{ fontSize: 13 }}>
                {subtitle}
              </Text>
            ) : null}
            <Column modifiers={[fillMaxWidth(), weight(1)]}>{children}</Column>
          </Column>
          {snackbarRef ? (
            <Box modifiers={[align("bottomCenter"), fillMaxWidth()]}>
              <SnackbarHost ref={snackbarRef}>
                <Snackbar
                  containerColor={colors.surface}
                  contentColor={colors.foreground}
                  actionContentColor={colors.primary}
                />
              </SnackbarHost>
            </Box>
          ) : null}
        </Box>
      </Host>
    </ScreenShell>
  );
}
