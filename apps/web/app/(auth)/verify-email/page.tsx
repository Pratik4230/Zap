"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

const schema = z.object({
  otp: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d+$/, "Code must be numbers only"),
});

const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [serverError, setServerError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sent, setSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const handleSendOtp = useCallback(async () => {
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

  // Auto-send OTP on mount
  useEffect(() => {
    if (!email) {
      router.replace("/sign-up");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleSendOtp();
  }, [email, router, handleSendOtp]);

  const form = useForm({
    defaultValues: { otp: "" },
    onSubmit: async ({ value }) => {
      setServerError("");
      const { error } = await authClient.emailOtp.verifyEmail({
        email,
        otp: value.otp,
      });
      if (error) {
        setServerError(error.message ?? "Invalid or expired code");
        return;
      }
      router.push("/dashboard");
    },
  });

  return (
    <>
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "oklch(0.769 0.188 70.08 / 15%)", border: "1px solid oklch(0.769 0.188 70.08 / 30%)" }}
        >
          <Mail size={26} style={{ color: "oklch(0.769 0.188 70.08)" }} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Check your email
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {sent ? (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </>
          ) : (
            "Sending verification code…"
          )}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field
          name="otp"
          validators={{
            onChange: ({ value }) => {
              const r = schema.shape.otp.safeParse(value);
              return r.success ? undefined : r.error.issues[0]?.message;
            },
          }}
        >
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Verification code</FieldLabel>
              <Input
                id={field.name}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="text-center text-lg tracking-[0.5em] font-mono"
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onBlur={field.handleBlur}
              />
              {field.state.meta.isTouched && (
                <FieldError
                  errors={field.state.meta.errors.map((e) => ({ message: String(e) }))}
                />
              )}
            </Field>
          )}
        </form.Field>

        {serverError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              disabled={isSubmitting || !sent}
              className="mt-1 w-full font-semibold"
              style={{ background: "oklch(0.769 0.188 70.08)", color: "oklch(0 0 0)" }}
            >
              {isSubmitting ? "Verifying…" : "Verify email"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-5 text-center text-sm text-muted-foreground">
        Didn&apos;t receive it?{" "}
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={handleSendOtp}
          className="font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: "oklch(0.769 0.188 70.08)" }}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </>
  );
}
