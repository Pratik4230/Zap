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
import { OAuthButtons } from "@/components/oauth-buttons";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function validate<K extends keyof z.infer<typeof schema>>(
  field: K,
  value: z.infer<typeof schema>[K]
): string | undefined {
  const result = schema.shape[field].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError("");
      const { error } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
        callbackURL: "/dashboard",
      });
      if (error) {
        setServerError(error.message ?? "Something went wrong");
        return;
      }
      // Redirect to email verification
      router.push(`/verify-email?email=${encodeURIComponent(value.email)}`);
    },
  });

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Start shortening links in seconds
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
          name="name"
          validators={{ onChange: ({ value }) => validate("name", value) }}
        >
          {(field) => (
            <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                id={field.name}
                type="text"
                autoComplete="name"
                placeholder="Enter your name"
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
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <Input
                id={field.name}
                type="password"
                autoComplete="new-password"
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
              style={{
                background: "oklch(0.769 0.188 70.08)",
                color: "oklch(0 0 0)",
              }}
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          )}
        </form.Subscribe>

        <OAuthButtons />
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium transition-colors"
          style={{ color: "oklch(0.769 0.188 70.08)" }}
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
