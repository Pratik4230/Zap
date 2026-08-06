import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Column,
  ListItem,
  OutlinedTextField,
  Text,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { authClient, signOutFully } from "@/features/auth/utils/client";
import { refreshAuthSession } from "@/features/auth/utils/navigation";
import { openWebBilling } from "@/features/billing/open-web-billing";
import { validateProfileName } from "@/features/settings/utils/profile";
import { getApiErrorMessage } from "@/global/api/errors";
import { apiClient } from "@/global/api/client";
import { queryKeys } from "@/global/api/query-keys";
import type { WorkspacePlan } from "@/global/api/types";
import { AppScreen } from "@/global/components/app-screen";
import { EmptyState, ErrorState, LoadingState } from "@/global/components/query-state";
import { toast } from "@/global/components/toast";
import { colors } from "@/global/theme";
import { useIsOnline } from "@/global/utils/network";

function planHeadline(plan: WorkspacePlan): string {
  return plan === "pro" ? "Pro" : "Free";
}

function planSupporting(plan: WorkspacePlan): string {
  return plan === "pro"
    ? "500 active links · 50,000 visits/mo · 1-year analytics"
    : "50 active links · 5,000 visits/mo · 7-day analytics";
}

/**
 * Settings — profile, plan, sign out, delete account.
 * Pro upgrade/manage: in-app browser (expo-web-browser) → xaply.in Dodo billing.
 * No Play IAP / RevenueCat in this app for now.
 */
export default function SettingsTabScreen() {
  const queryClient = useQueryClient();
  const online = useIsOnline();
  const { data: session, isPending: isSessionPending, error: sessionError } =
    authClient.useSession();

  const {
    data: plan,
    isPending: isPlanPending,
    isError: isPlanError,
    refetch: refetchPlan,
  } = useQuery({
    queryKey: queryKeys.billing,
    queryFn: () => apiClient.billing.plan(),
    enabled: Boolean(session?.user),
  });

  const nameState = useNativeState("");
  const deleteConfirmState = useNativeState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [openingBilling, setOpeningBilling] = useState(false);

  useEffect(() => {
    const currentName = session?.user?.name?.trim() ?? "";
    if (currentName) {
      nameState.set(currentName);
      setNameDraft(currentName);
    }
  }, [session?.user?.name]);

  const profileMutation = useMutation({
    mutationFn: (name: string) => apiClient.profile.update(name),
    onSuccess: async (user) => {
      nameState.set(user.name);
      setNameDraft(user.name);
      setNameError("");
      setServerError("");
      setSuccessMessage("Profile updated");
      toast("Profile updated");
      await refreshAuthSession();
    },
    onError: (error) => {
      setSuccessMessage("");
      setServerError(getApiErrorMessage(error));
      toast(getApiErrorMessage(error), "error");
    },
  });

  function saveProfile() {
    if (!online) {
      setServerError("You’re offline. Reconnect to save your profile.");
      setSuccessMessage("");
      return;
    }
    const nextName = nameState.get().trim();
    const validationError = validateProfileName(nextName);
    if (validationError) {
      setNameError(validationError);
      setSuccessMessage("");
      return;
    }

    setNameError("");
    setServerError("");
    setSuccessMessage("");
    profileMutation.mutate(nextName);
  }

  async function signOut() {
    if (!online) {
      setServerError("You’re offline. Reconnect to sign out.");
      setSuccessMessage("");
      return;
    }
    setSigningOut(true);
    setServerError("");
    setSuccessMessage("");
    try {
      await signOutFully();
      queryClient.clear();
    } catch (error) {
      setServerError(getApiErrorMessage(error));
      setSigningOut(false);
      toast(getApiErrorMessage(error), "error");
    }
  }

  function confirmDeleteAccount() {
    const email = session?.user?.email ?? "";
    if (!email) return;
    if (deleteConfirm.trim().toLowerCase() !== email.toLowerCase()) {
      setServerError("Type your email exactly to confirm deletion.");
      return;
    }
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account, links, and analytics. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void deleteAccount(),
        },
      ]
    );
  }

  async function deleteAccount() {
    if (!online) {
      setServerError("You’re offline. Reconnect to delete your account.");
      return;
    }
    setDeleting(true);
    setServerError("");
    try {
      const { error } = await authClient.deleteUser();
      if (error) throw new Error(error.message ?? "Failed to delete account");
      await signOutFully();
      queryClient.clear();
      toast("Account deleted");
    } catch (error) {
      setServerError(getApiErrorMessage(error));
      toast(getApiErrorMessage(error), "error");
      setDeleting(false);
    }
  }

  async function openBillingInApp() {
    if (!online) {
      toast("You’re offline. Reconnect to manage billing.", "error");
      return;
    }
    setOpeningBilling(true);
    try {
      await openWebBilling();
      const { data: nextPlan } = await refetchPlan();
      if (nextPlan === "pro") {
        toast("You’re on Pro");
      }
    } catch (error) {
      toast(getApiErrorMessage(error), "error");
    } finally {
      setOpeningBilling(false);
    }
  }

  const email = session?.user?.email ?? "";
  const currentName = session?.user?.name?.trim() ?? "";
  const isBusy =
    profileMutation.isPending || signingOut || deleting || openingBilling;
  const canSave =
    Boolean(nameDraft.trim()) &&
    nameDraft.trim() !== currentName &&
    !nameError &&
    !isBusy;

  return (
    <AppScreen title="Settings" subtitle="Profile, plan, and account.">
      <Column verticalArrangement={{ spacedBy: 14 }} modifiers={[fillMaxWidth()]}>
        {isSessionPending ? <LoadingState message="Loading account..." /> : null}

        {!isSessionPending && sessionError ? (
          <ErrorState
            message={getApiErrorMessage(sessionError)}
            onRetry={() => void refreshAuthSession()}
          />
        ) : null}

        {!isSessionPending && !sessionError && !session?.user ? (
          <EmptyState
            title="Not signed in"
            description="Sign in again to manage your account."
          />
        ) : null}

        {!isSessionPending && session?.user ? (
          <>
            <ListItem
              colors={{
                containerColor: colors.surface,
                contentColor: colors.foreground,
                supportingContentColor: colors.muted,
                overlineContentColor: colors.muted,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <ListItem.OverlineContent>
                <Text style={{ fontSize: 11, fontWeight: "600" }}>EMAIL</Text>
              </ListItem.OverlineContent>
              <ListItem.HeadlineContent>
                <Text style={{ fontSize: 15, fontWeight: "600" }} maxLines={1} overflow="ellipsis">
                  {email || "Not set"}
                </Text>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Text>Email can’t be changed in the app.</Text>
              </ListItem.SupportingContent>
            </ListItem>

            <ListItem
              colors={{
                containerColor: colors.surface,
                contentColor: colors.foreground,
                supportingContentColor: colors.muted,
                overlineContentColor: colors.muted,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <ListItem.OverlineContent>
                <Text style={{ fontSize: 11, fontWeight: "600" }}>PLAN</Text>
              </ListItem.OverlineContent>
              <ListItem.HeadlineContent>
                <Text style={{ fontSize: 15, fontWeight: "600" }}>
                  {isPlanPending
                    ? "Loading…"
                    : isPlanError
                      ? "Unavailable"
                      : planHeadline(plan ?? "free")}
                </Text>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Text>
                  {isPlanPending
                    ? "Fetching your workspace plan."
                    : isPlanError
                      ? "Couldn’t load plan. Tap Retry plan below."
                      : planSupporting(plan ?? "free")}
                </Text>
              </ListItem.SupportingContent>
            </ListItem>

            {isPlanError ? (
              <Button
                enabled={online && !isBusy}
                onClick={() => void refetchPlan()}
                colors={{
                  containerColor: colors.surface,
                  contentColor: colors.foreground,
                }}
                modifiers={[fillMaxWidth()]}
              >
                <Text style={{ fontWeight: "600" }}>Retry plan</Text>
              </Button>
            ) : null}

            {!isPlanPending && !isPlanError ? (
              <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
                <Button
                  enabled={online && !isBusy}
                  onClick={() => void openBillingInApp()}
                  colors={{
                    containerColor:
                      plan === "pro" ? colors.surface : colors.primary,
                    contentColor:
                      plan === "pro" ? colors.foreground : colors.primaryForeground,
                  }}
                  modifiers={[fillMaxWidth()]}
                >
                  <Text style={{ fontWeight: "600" }}>
                    {openingBilling
                      ? "Opening…"
                      : plan === "pro"
                        ? "Manage billing"
                        : "Upgrade to Pro"}
                  </Text>
                </Button>
                <Text color={colors.muted} style={{ fontSize: 12 }}>
                  {plan === "pro"
                    ? "Opens Xaply billing in an in-app browser. Sign in with the same account if asked."
                    : "Complete payment in an in-app browser on xaply.in. Use the same account if asked to sign in."}
                </Text>
              </Column>
            ) : null}

            <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
              <Text color={colors.muted} style={{ fontSize: 12, fontWeight: "600" }}>
                DISPLAY NAME
              </Text>
              <OutlinedTextField
                value={nameState}
                singleLine
                maxLength={100}
                enabled={!isBusy}
                onValueChange={(value) => {
                  setNameDraft(value);
                  setNameError(validateProfileName(value) ?? "");
                  setSuccessMessage("");
                }}
                keyboardOptions={{
                  keyboardType: "text",
                  capitalization: "words",
                  autoCorrectEnabled: false,
                  imeAction: "done",
                }}
                modifiers={[fillMaxWidth()]}
              >
                <OutlinedTextField.Label>
                  <Text>Display name</Text>
                </OutlinedTextField.Label>
                <OutlinedTextField.Placeholder>
                  <Text>Your name</Text>
                </OutlinedTextField.Placeholder>
              </OutlinedTextField>

              {nameError ? (
                <Text color={colors.destructive} style={{ fontSize: 13 }}>
                  {nameError}
                </Text>
              ) : null}

              {serverError ? (
                <Text color={colors.destructive} style={{ fontSize: 13 }}>
                  {serverError}
                </Text>
              ) : null}

              {successMessage ? (
                <Text color={colors.primary} style={{ fontSize: 13 }}>
                  {successMessage}
                </Text>
              ) : null}

              <Button
                enabled={canSave}
                onClick={saveProfile}
                colors={{
                  containerColor: colors.primary,
                  contentColor: colors.primaryForeground,
                }}
                modifiers={[fillMaxWidth()]}
              >
                <Text style={{ fontWeight: "600" }}>
                  {profileMutation.isPending ? "Saving..." : "Save changes"}
                </Text>
              </Button>
            </Column>

            <Button
              enabled={!isBusy}
              onClick={() => void signOut()}
              colors={{
                containerColor: colors.surface,
                contentColor: colors.foreground,
              }}
              modifiers={[fillMaxWidth()]}
            >
              <Text style={{ fontWeight: "600" }}>
                {signingOut ? "Signing out..." : "Sign out"}
              </Text>
            </Button>

            <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
              <Text color={colors.destructive} style={{ fontSize: 13, fontWeight: "700" }}>
                Danger zone
              </Text>
              <Text color={colors.muted} style={{ fontSize: 12 }}>
                Type {email} to confirm permanent account deletion.
              </Text>
              <OutlinedTextField
                value={deleteConfirmState}
                singleLine
                enabled={!isBusy}
                onValueChange={(value) => {
                  setDeleteConfirm(value);
                }}
                keyboardOptions={{
                  keyboardType: "email",
                  capitalization: "none",
                  autoCorrectEnabled: false,
                  imeAction: "done",
                }}
                modifiers={[fillMaxWidth()]}
              >
                <OutlinedTextField.Label>
                  <Text>Confirm email</Text>
                </OutlinedTextField.Label>
                <OutlinedTextField.Placeholder>
                  <Text>{email}</Text>
                </OutlinedTextField.Placeholder>
              </OutlinedTextField>
              <Button
                enabled={!isBusy && deleteConfirm.trim().length > 0}
                onClick={confirmDeleteAccount}
                colors={{
                  containerColor: colors.destructive,
                  contentColor: "#ffffff",
                }}
                modifiers={[fillMaxWidth()]}
              >
                <Text style={{ fontWeight: "600" }}>
                  {deleting ? "Deleting..." : "Delete account"}
                </Text>
              </Button>
            </Column>
          </>
        ) : null}
      </Column>
    </AppScreen>
  );
}
