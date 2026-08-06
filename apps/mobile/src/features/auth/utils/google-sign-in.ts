import * as Linking from "expo-linking";
import { authClient } from "@/features/auth/utils/client";
import { enterApp } from "@/features/auth/utils/navigation";

/** Must match `scheme` in app.json / expoClient — not https (expo-router origin). */
const APP_SCHEME = "xaply";

function isUserCancelled(message: string): boolean {
  return /cancel|dismiss|closed|abort/i.test(message);
}

function formatAuthError(error: {
  message?: string | null;
  code?: string | null;
  status?: number;
}): string {
  const message = error.message?.trim() || "Google sign-in failed";
  if (error.code && !message.includes(error.code)) {
    return `${message} (${error.code})`;
  }
  return message;
}

/**
 * Google OAuth via Better Auth Expo (Chrome Custom Tabs → deep link).
 *
 * Uses an explicit `xaply://` callback so Expo Router's https `origin` does not
 * turn `/` into `https://xaply.in/` (that breaks the Expo cookie deep-link).
 *
 * @see https://www.better-auth.com/docs/integrations/expo#social-sign-in
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const callbackURL = Linking.createURL("/", { scheme: APP_SCHEME });
  const errorCallbackURL = Linking.createURL("/sign-in", {
    scheme: APP_SCHEME,
  });

  const { error } = await authClient.signIn.social({
    provider: "google",
    callbackURL,
    errorCallbackURL,
  });

  if (error) {
    const message = formatAuthError(error);
    if (isUserCancelled(message)) return { error: null };
    return { error: message };
  }

  try {
    // Expo social can resolve before session atom refreshes.
    await authClient.getSession();
    await enterApp();
    return { error: null };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Signed in with Google, but could not open the app.",
    };
  }
}
