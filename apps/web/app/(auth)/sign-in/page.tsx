"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { OAuthButtons } from "@/components/oauth-buttons";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

function validate<K extends keyof z.infer<typeof schema>>(
  field: K,
  value: z.infer<typeof schema>[K]
): string | undefined {
  const result = schema.shape[field].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [serverError, setServerError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError("");
      setUnverifiedEmail("");
      const { error } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
        callbackURL: next,
      });
      if (error) {
        const msg = error.message ?? "";
        if (msg.toLowerCase().includes("verif")) {
          setUnverifiedEmail(value.email);
          return;
        }
        setServerError(msg || "Something went wrong");
        return;
      }
      router.push(next);
    },
  });

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to manage your short links
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
          name="email"
          validators={{ onChange: ({ value }) => validate("email", value) }}
        >
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                id={field.name}
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
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

        <form.Field
          name="password"
          validators={{ onChange: ({ value }) => validate("password", value) }}
        >
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: "oklch(0.769 0.188 70.08)" }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id={field.name}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
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

        {unverifiedEmail ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm">
            <p className="text-amber-400 font-medium">Email not verified</p>
            <p className="mt-1 text-muted-foreground">
              Check your inbox or{" "}
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="font-medium text-amber-400 hover:underline"
              >
                resend the code
              </Link>
              .
            </p>
          </div>
        ) : serverError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {serverError}
          </p>
        ) : null}

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full font-semibold"
              style={{
                background: "oklch(0.769 0.188 70.08)",
                color: "oklch(0 0 0)",
              }}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          )}
        </form.Subscribe>

        <OAuthButtons />
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium transition-colors"
          style={{ color: "oklch(0.769 0.188 70.08)" }}
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
