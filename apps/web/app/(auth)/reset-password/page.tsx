"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const schema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code").regex(/^\d+$/, "Code must be numbers only"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm({
    defaultValues: { otp: "", password: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirmPassword) {
        setServerError("Passwords do not match");
        return;
      }
      setServerError("");

      // Verify OTP and reset password
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp: value.otp,
        password: value.password,
      });

      if (error) {
        setServerError(error.message ?? "Invalid or expired code");
        return;
      }
      setSuccess(true);
    },
  });

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Invalid reset link.</p>
        <Link href="/forgot-password" className="mt-4 block text-sm font-medium" style={{ color: "oklch(0.769 0.188 70.08)" }}>
          Try again
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "oklch(0.769 0.188 70.08 / 15%)", border: "1px solid oklch(0.769 0.188 70.08 / 30%)" }}
        >
          <CheckCircle2 size={28} style={{ color: "oklch(0.769 0.188 70.08)" }} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Password reset!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your password has been updated successfully.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block rounded-lg px-6 py-2.5 text-sm font-semibold transition-all"
          style={{ background: "oklch(0.769 0.188 70.08)", color: "oklch(0 0 0)" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reset password
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter the code sent to{" "}
          <span className="font-medium text-foreground">{email}</span>
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
              <FieldLabel htmlFor={field.name}>Reset code</FieldLabel>
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
                <FieldError errors={field.state.meta.errors.map((e) => ({ message: String(e) }))} />
              )}
            </Field>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              const r = schema.shape.password.safeParse(value);
              return r.success ? undefined : r.error.issues[0]?.message;
            },
          }}
        >
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>New password</FieldLabel>
              <Input
                id={field.name}
                type="password"
                autoComplete="new-password"
                placeholder="Enter your new password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {field.state.meta.isTouched && (
                <FieldError errors={field.state.meta.errors.map((e) => ({ message: String(e) }))} />
              )}
            </Field>
          )}
        </form.Field>

        <form.Field
          name="confirmPassword"
          validators={{
            onChangeListenTo: ["password"],
            onChange: ({ value, fieldApi }) => {
              if (value !== fieldApi.form.getFieldValue("password")) {
                return "Passwords do not match";
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
              <Input
                id={field.name}
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your new password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {field.state.meta.isTouched && (
                <FieldError errors={field.state.meta.errors.map((e) => ({ message: String(e) }))} />
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
              disabled={isSubmitting}
              className="mt-1 w-full font-semibold"
              style={{ background: "oklch(0.769 0.188 70.08)", color: "oklch(0 0 0)" }}
            >
              {isSubmitting ? "Resetting…" : "Reset password"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
