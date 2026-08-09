import { useState } from "react";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Column,
  OutlinedTextField,
  Row,
  Text,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, padding } from "@expo/ui/jetpack-compose/modifiers";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AuthSwitchLink } from "@/features/auth/components/auth-switch-link";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { authClient } from "@/features/auth/utils/client";
import { finishSignIn } from "@/features/auth/utils/navigation";
import { signInSchema, type SignInValues } from "@/features/auth/utils/schemas";
import { colors } from "@/global/theme";

function SignInForm() {
  const email = useNativeState("");
  const password = useNativeState("");

  const {
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const [serverError, setServerError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [oauthBusy, setOauthBusy] = useState(false);

  const formBusy = isSubmitting || oauthBusy;

  function syncFromNative() {
    setValue("email", email.get().trim(), { shouldValidate: false });
    setValue("password", password.get(), { shouldValidate: false });
  }

  const onValid = handleSubmit(
    async ({ email: emailValue, password: passwordValue }) => {
      setServerError("");
      setUnverifiedEmail("");

      const { error } = await authClient.signIn.email({
        email: emailValue,
        password: passwordValue,
      });

      if (error) {
        const msg = error.message ?? "";
        if (msg.toLowerCase().includes("verif")) {
          setUnverifiedEmail(emailValue);
          return;
        }
        setServerError(msg || "Something went wrong");
        return;
      }

      try {
        await finishSignIn();
      } catch (e) {
        setServerError(
          e instanceof Error
            ? e.message
            : "Signed in, but could not open the app.",
        );
      }
    },
  );

  async function onSubmit() {
    syncFromNative();
    await onValid();
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to manage your short links"
      footer={
        <>
          <AuthPrimaryButton
            label="Sign in"
            loadingLabel="Signing in…"
            loading={isSubmitting}
            enabled={!formBusy}
            onPress={() => void onSubmit()}
          />
          <GoogleSignInButton
            enabled={!formBusy}
            onBusyChange={setOauthBusy}
            onError={(message) => {
              setUnverifiedEmail("");
              setServerError(message);
            }}
          />
          <AuthSwitchLink
            prompt="Don't have an account?"
            actionLabel="Sign up"
            enabled={!formBusy}
            onPress={() => router.push("/sign-up")}
          />
        </>
      }
    >
      <OutlinedTextField
        value={email}
        singleLine
        enabled={!formBusy}
        isError={!!errors.email}
        onValueChange={(value) =>
          setValue("email", value, { shouldValidate: true })
        }
        keyboardOptions={{
          keyboardType: "email",
          capitalization: "none",
          autoCorrectEnabled: false,
          imeAction: "next",
        }}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField.Label>
          <Text>Email</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.Placeholder>
          <Text>Enter Your Email</Text>
        </OutlinedTextField.Placeholder>
        {errors.email ? (
          <OutlinedTextField.SupportingText>
            <Text>{errors.email.message}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>

      <OutlinedTextField
        value={password}
        singleLine
        enabled={!formBusy}
        isError={!!errors.password}
        visualTransformation="password"
        onValueChange={(value) =>
          setValue("password", value, { shouldValidate: true })
        }
        keyboardOptions={{
          keyboardType: "password",
          capitalization: "none",
          autoCorrectEnabled: false,
          imeAction: "done",
        }}
        keyboardActions={{ onDone: () => void onSubmit() }}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField.Label>
          <Text>Password</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.Placeholder>
          <Text>Your password</Text>
        </OutlinedTextField.Placeholder>
        {errors.password ? (
          <OutlinedTextField.SupportingText>
            <Text>{errors.password.message}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>

      <Row
        horizontalArrangement="end"
        verticalAlignment="center"
        modifiers={[fillMaxWidth()]}
      >
        <TextButton
          enabled={!formBusy}
          contentPadding={{ start: 0, top: 0, end: 0, bottom: 0 }}
          onClick={() => router.push("/forgot-password")}
        >
          <Text color={colors.primary} style={{ fontSize: 14 }}>
            Forgot password?
          </Text>
        </TextButton>
      </Row>

      {unverifiedEmail ? (
        <Column
          verticalArrangement={{ spacedBy: 8 }}
          modifiers={[padding(12, 12, 12, 12), fillMaxWidth()]}
        >
          <Text color={colors.warning} style={{ fontWeight: "600" }}>
            Email not verified
          </Text>
          <Text color={colors.muted} style={{ fontSize: 13 }}>
            Check your inbox or resend the code on the next screen.
          </Text>
          <TextButton
            contentPadding={{ start: 0, top: 0, end: 0, bottom: 0 }}
            onClick={() =>
              router.push(
                `/verify-email?email=${encodeURIComponent(unverifiedEmail)}`,
              )
            }
          >
            <Text color={colors.primary}>Verify email</Text>
          </TextButton>
        </Column>
      ) : serverError ? (
        <Text color={colors.destructive} style={{ fontSize: 13 }}>
          {serverError}
        </Text>
      ) : null}

    </AuthScreen>
  );
}

export default SignInForm;
