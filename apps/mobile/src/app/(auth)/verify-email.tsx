import { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
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
import { otpSchema, type OtpValues } from "../../lib/auth-schemas";
import { colors } from "../../lib/theme";
import { AuthScreen } from "../../components/auth/auth-screen";

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
    router.replace("/");
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

      <Button
        enabled={!isSubmitting && sent}
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
          {isSubmitting ? "Verifying…" : "Verify email"}
        </Text>
      </Button>

      <Row
        horizontalArrangement="center"
        verticalAlignment="center"
        modifiers={[fillMaxWidth()]}
      >
        <Text color={colors.muted} style={{ fontSize: 14 }}>
          Didn't receive it?
        </Text>
        <TextButton
          enabled={cooldown === 0 && !isSubmitting}
          contentPadding={{ start: 4, top: 0, end: 0, bottom: 0 }}
          onClick={() => void handleSendOtp()}
        >
          <Text color={colors.primary} style={{ fontSize: 14, fontWeight: "600" }}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </Text>
        </TextButton>
      </Row>

      <TextButton
        contentPadding={{ start: 0, top: 0, end: 0, bottom: 0 }}
        onClick={() => router.replace("/sign-in")}
      >
        <Text color={colors.muted} style={{ fontSize: 14 }}>
          Back to sign in
        </Text>
      </TextButton>
    </AuthScreen>
  );
}

export default VerifyEmailForm;
