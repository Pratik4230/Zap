import { useState } from "react";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  OutlinedTextField,
  Text,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AuthSwitchLink } from "@/features/auth/components/auth-switch-link";
import { authClient } from "@/features/auth/utils/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/features/auth/utils/schemas";
import { colors } from "@/global/theme";

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
      footer={
        <>
          <AuthPrimaryButton
            label="Send reset code"
            loadingLabel="Sending…"
            loading={isSubmitting}
            enabled={!isSubmitting}
            onPress={() => void onSubmit()}
          />
          <AuthSwitchLink
            prompt="Remember it?"
            actionLabel="Sign in"
            enabled={!isSubmitting}
            onPress={() => router.replace("/sign-in")}
          />
        </>
      }
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
          <Text>Enter Your Email</Text>
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
    </AuthScreen>
  );
}

export default ForgotPasswordForm;
