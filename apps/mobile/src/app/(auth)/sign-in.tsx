import { useState } from "react";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Column,
  OutlinedTextField,
  Row,
  Text,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  padding,
} from "@expo/ui/jetpack-compose/modifiers";
import { authClient } from "@/auth/client";
import { enterApp } from "@/auth/navigation";
import {
  signInSchema,
  type SignInValues,
} from "@/auth/schemas";
import { colors } from "@/theme";
import { AuthScreen } from "@/components/auth/auth-screen";

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

  function syncFromNative() {
    setValue("email", email.get().trim(), { shouldValidate: false });
    setValue("password", password.get(), { shouldValidate: false });
  }

  const onValid = handleSubmit(async ({ email: emailValue, password: passwordValue }) => {
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

    // Session → Stack.Protected opens (app); "/" = Links tab
    await enterApp();
  });

  async function onSubmit() {
    syncFromNative();
    await onValid();
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to manage your short links"
    >
      <OutlinedTextField
        value={email}
        singleLine
        enabled={!isSubmitting}
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
          <Text>you@example.com</Text>
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
        enabled={!isSubmitting}
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
          enabled={!isSubmitting}
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
                `/verify-email?email=${encodeURIComponent(unverifiedEmail)}`
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

      <Button
        enabled={!isSubmitting}
        onClick={() => void onSubmit()}
        colors={{
          containerColor: colors.primary,
          contentColor: colors.primaryForeground,
          disabledContainerColor: "#5c3d00",
          disabledContentColor: "#1a1a1a",
        }}
        modifiers={[fillMaxWidth()]}
      >
        <Text style={{ fontWeight: "600" }}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Text>
      </Button>

      <Row
        horizontalArrangement="center"
        verticalAlignment="center"
        modifiers={[fillMaxWidth()]}
      >
        <Text color={colors.muted} style={{ fontSize: 14 }}>
          Don't have an account?
        </Text>
        <TextButton
          enabled={!isSubmitting}
          contentPadding={{ start: 4, top: 0, end: 0, bottom: 0 }}
          onClick={() => router.push("/sign-up")}
        >
          <Text color={colors.primary} style={{ fontSize: 14, fontWeight: "600" }}>
            Sign up
          </Text>
        </TextButton>
      </Row>
    </AuthScreen>
  );
}

export default SignInForm;
