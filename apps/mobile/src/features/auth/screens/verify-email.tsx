import { useCallback, useEffect, useRef, useState } from "react";
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
import { finishSignIn } from "@/features/auth/utils/navigation";
import { otpSchema, type OtpValues } from "@/features/auth/utils/schemas";
import { colors } from "@/global/theme";

const RESEND_COOLDOWN = 60;

function VerifyEmailForm() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = typeof emailParam === "string" ? emailParam : "";

  const otp = useNativeState("");
  const {
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
    mode: "onChange",
  });

  const [serverError, setServerError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const hasSentRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const handleSendOtp = useCallback(async () => {
    if (!email) return;
    setServerError("");
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    if (error) {
      setServerError(error.message ?? "Failed to send code");
      return;
    }
    setSent(true);
    startCooldown();
  }, [email, startCooldown]);

  useEffect(() => {
    if (!email) {
      router.replace("/sign-up");
      return;
    }
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    void handleSendOtp();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [email, handleSendOtp]);

  const onValid = handleSubmit(async ({ otp: code }) => {
    setServerError("");
    const { error } = await authClient.emailOtp.verifyEmail({
      email,
      otp: code,
    });
    if (error) {
      setServerError(error.message ?? "Invalid or expired code");
      return;
    }
    try {
      await finishSignIn();
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : "Verified, but could not open the app.",
      );
    }
  });

  async function onSubmit() {
    setValue("otp", otp.get().replace(/\D/g, "").slice(0, 6), {
      shouldValidate: false,
    });
    await onValid();
  }

  if (!email) return null;

  return (
    <AuthScreen
      title="Check your email"
      subtitle={
        sent
          ? `We sent a 6-digit code to ${email}`
          : "Sending verification code…"
      }
      footer={
        <>
          <AuthPrimaryButton
            label="Verify email"
            loadingLabel="Verifying…"
            loading={isSubmitting}
            enabled={!isSubmitting && sent}
            onPress={() => void onSubmit()}
          />
          <AuthSwitchLink
            prompt="Didn't receive it?"
            actionLabel={
              cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"
            }
            enabled={cooldown === 0 && !isSubmitting}
            onPress={() => void handleSendOtp()}
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
        enabled={!isSubmitting && sent}
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
          imeAction: "done",
        }}
        keyboardActions={{ onDone: () => void onSubmit() }}
        modifiers={[fillMaxWidth()]}
      >
        <OutlinedTextField.Label>
          <Text>Verification code</Text>
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

      {serverError ? (
        <Text color={colors.destructive} style={{ fontSize: 13 }}>
          {serverError}
        </Text>
      ) : null}
    </AuthScreen>
  );
}

export default VerifyEmailForm;
