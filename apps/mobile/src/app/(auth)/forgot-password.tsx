import { useState } from "react";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  OutlinedTextField,
  Row,
  Text,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { authClient } from "../../lib/auth-client";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../../lib/auth-schemas";
import { colors } from "../../lib/theme";
import { AuthScreen } from "../../components/auth/auth-screen";

function ForgotPasswordForm() {
  const email = useNativeState("");
  const {
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  const [serverError, setServerError] = useState("");

  const onValid = handleSubmit(async ({ email: emailValue }) => {
    setServerError("");
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: emailValue,
      type: "forget-password",
    });
    if (error) {
      setServerError(error.message ?? "Something went wrong");
      return;
    }
    router.push(`/reset-password?email=${encodeURIComponent(emailValue)}`);
  });

  async function onSubmit() {
    setValue("email", email.get().trim(), { shouldValidate: false });
    await onValid();
  }

  return (
    <AuthScreen
      title="Forgot password?"
      subtitle="Enter your email and we'll send a reset code"
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
          imeAction: "done",
        }}
        keyboardActions={{ onDone: () => void onSubmit() }}
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

      {serverError ? (
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
          {isSubmitting ? "Sending…" : "Send reset code"}
        </Text>
      </Button>

      <Row
        horizontalArrangement="center"
        verticalAlignment="center"
        modifiers={[fillMaxWidth()]}
      >
        <Text color={colors.muted} style={{ fontSize: 14 }}>
          Remember it?
        </Text>
        <TextButton
          enabled={!isSubmitting}
          contentPadding={{ start: 4, top: 0, end: 0, bottom: 0 }}
          onClick={() => router.replace("/sign-in")}
        >
          <Text color={colors.primary} style={{ fontSize: 14, fontWeight: "600" }}>
            Sign in
          </Text>
        </TextButton>
      </Row>
    </AuthScreen>
  );
}

export default ForgotPasswordForm;
