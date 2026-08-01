import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { validateProfileName } from "@/features/settings/utils/profile";
import { getApiErrorMessage } from "@/global/api/errors";
import { apiClient } from "@/global/api/client";
import { AppScreen } from "@/global/components/app-screen";
import { EmptyState, ErrorState, LoadingState } from "@/global/components/query-state";
import { toast } from "@/global/components/toast";
import { colors } from "@/global/theme";
import { useIsOnline } from "@/global/utils/network";

/**
 * Settings — profile, sign out, delete account.
 * Plan / billing left for in-app purchases later.
 */
export default function SettingsTabScreen() {
  const queryClient = useQueryClient();
  const online = useIsOnline();
  const { data: session, isPending: isSessionPending, error: sessionError } =
    authClient.useSession();

  const nameState = useNativeState("");
  const deleteConfirmState = useNativeState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

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

  const email = session?.user?.email ?? "";
  const currentName = session?.user?.name?.trim() ?? "";
  const isBusy = profileMutation.isPending || signingOut || deleting;
  const canSave =
    Boolean(nameDraft.trim()) &&
    nameDraft.trim() !== currentName &&
    !nameError &&
    !isBusy;

  return (
    <AppScreen title="Settings" subtitle="Profile and account controls.">
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
