import { useEffect, useState } from "react";
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
import { authClient } from "@/features/auth/utils/client";
import { refreshAuthSession } from "@/features/auth/utils/navigation";
import { validateProfileName } from "@/features/settings/utils/profile";
import { getApiErrorMessage } from "@/global/api/errors";
import { apiClient } from "@/global/api/client";
import { AppScreen } from "@/global/components/app-screen";
import { EmptyState, ErrorState, LoadingState } from "@/global/components/query-state";
import { colors } from "@/global/theme";

/**
 * Settings — profile name + sign out.
 * Plan / billing left for in-app purchases later.
 */
export default function SettingsTabScreen() {
  const queryClient = useQueryClient();
  const { data: session, isPending: isSessionPending, error: sessionError } =
    authClient.useSession();

  const nameState = useNativeState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

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
      await refreshAuthSession();
    },
    onError: (error) => {
      setSuccessMessage("");
      setServerError(getApiErrorMessage(error));
    },
  });

  function saveProfile() {
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
    setSigningOut(true);
    setServerError("");
    setSuccessMessage("");
    try {
      await authClient.signOut();
      queryClient.clear();
    } catch (error) {
      setServerError(getApiErrorMessage(error));
      setSigningOut(false);
    }
  }

  const email = session?.user?.email ?? "";
  const currentName = session?.user?.name?.trim() ?? "";
  const isBusy = profileMutation.isPending || signingOut;
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
          </>
        ) : null}
      </Column>
    </AppScreen>
  );
}
