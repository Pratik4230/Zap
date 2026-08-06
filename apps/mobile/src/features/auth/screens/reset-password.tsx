import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
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
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/features/auth/utils/schemas";
import { colors } from "@/global/theme";

function ResetPasswordForm() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = typeof emailParam === "string" ? emailParam : "";

  const otp = useNativeState("");
  const password = useNativeState("");
  const confirmPassword = useNativeState("");

  const {
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", password: "", confirmPassword: "" },
    mode: "onChange",
  });

  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const onValid = handleSubmit(async (values) => {
    setServerError("");
    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp: values.otp,
      password: values.password,
    });
    if (error) {
      setServerError(error.message ?? "Invalid or expired code");
      return;
    }
    setSuccess(true);
  });

  async function onSubmit() {
    setValue("otp", otp.get().replace(/\D/g, "").slice(0, 6), {
      shouldValidate: false,
    });
    setValue("password", password.get(), { shouldValidate: false });
    setValue("confirmPassword", confirmPassword.get(), {
      shouldValidate: false,
    });
    await onValid();
  }

  if (!email) {
    return (
      <AuthScreen
        title="Invalid reset link"
        subtitle="Request a new code to continue."
        footer={
          <AuthPrimaryButton
            label="Try again"
            onPress={() => router.replace("/forgot-password")}
          />
        }
      />
    );
  }

  if (success) {
    return (
      <AuthScreen
        title="Password reset!"
        subtitle="Your password has been updated successfully."
        footer={
          <AuthPrimaryButton
            label="Sign in"
            onPress={() => router.replace("/sign-in")}
          />
        }
      />
    );
  }

  return (
    <AuthScreen
      title="Reset password"
      subtitle={`Enter the code sent to ${email}`}
      footer={
        <>
          <AuthPrimaryButton
            label="Reset password"
            loadingLabel="Resetting…"
            loading={isSubmitting}
            enabled={!isSubmitting}
            onPress={() => void onSubmit()}
          />
          <AuthSwitchLink
            actionLabel="Back to sign in"
            enabled={!isSubmitting}
            onPress={() => router.replace("/sign-in")}
          />
        </>
      }
    >
      <OutlinedTextField
        value={otp}
        singleLine
        enabled={!isSubmitting}
        isError={!!errors.otp}
        maxLength={6}
        onValueChange={(value) => {
          const digits = value.replace(/\D/g, "").slice(0, 6);
          setValue("otp", digits, { shouldValidate: true });
        }}
        keyboardOptions={{
          keyboardType: "number",
          capitalization: "none",
          autoCorrectEnabled: false,
          imeAction: "next",
        }}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField.Label>
          <Text>Reset code</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.Placeholder>
          <Text>6-digit code</Text>
        </OutlinedTextField.Placeholder>
        {errors.otp ? (
          <OutlinedTextField.SupportingText>
            <Text>{errors.otp.message}</Text>
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
          imeAction: "next",
        }}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField.Label>
          <Text>New password</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.Placeholder>
          <Text>At least 8 characters</Text>
        </OutlinedTextField.Placeholder>
        {errors.password ? (
          <OutlinedTextField.SupportingText>
            <Text>{errors.password.message}</Text>
          </OutlinedTextField.SupportingText>
        ) : null}
      </OutlinedTextField>

      <OutlinedTextField
        value={confirmPassword}
        singleLine
        enabled={!isSubmitting}
        isError={!!errors.confirmPassword}
        visualTransformation="password"
        onValueChange={(value) =>
          setValue("confirmPassword", value, { shouldValidate: true })
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
          <Text>Confirm password</Text>
        </OutlinedTextField.Label>
        <OutlinedTextField.Placeholder>
          <Text>Confirm new password</Text>
        </OutlinedTextField.Placeholder>
        {errors.confirmPassword ? (
          <OutlinedTextField.SupportingText>
            <Text>{errors.confirmPassword.message}</Text>
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

export default ResetPasswordForm;
