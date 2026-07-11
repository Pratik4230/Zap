"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Shuffle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { SHORT_LINK_DOMAIN } from "@xaply/db";
import {
  validateClickLimitField,
  validateDestinationField,
  validateExpiresAtField,
  validateLinkPasswordField,
  validateSlugField,
  validateTitleField,
} from "@/lib/validation";
import type { DashboardLink } from "@/lib/links-query-cache";

const AMBER = "oklch(0.769 0.188 70.08)";

function generateSlug() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

interface CreateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (link: DashboardLink) => void;
}

export function CreateLinkDialog({ open, onOpenChange, onCreated }: CreateLinkDialogProps) {
  const [serverError, setServerError] = useState("");

  const form = useForm({
    defaultValues: { destination: "", slug: "", title: "", expiresAt: "", clickLimit: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError("");

      const destinationError = validateDestinationField(value.destination);
      const slugError = validateSlugField(value.slug);
      const titleError = validateTitleField(value.title);
      const expiresAtError = validateExpiresAtField(value.expiresAt);
      const clickLimitError = validateClickLimitField(value.clickLimit);
      const passwordError = validateLinkPasswordField(value.password);
      if (destinationError || slugError || titleError || expiresAtError || clickLimitError || passwordError) {
        setServerError(
          destinationError ?? slugError ?? titleError ?? expiresAtError ?? clickLimitError ?? passwordError ?? "Invalid input"
        );
        return;
      }

      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationUrl: value.destination.trim(),
          slug: value.slug || undefined,
          title: value.title || undefined,
          expiresAt: value.expiresAt ? new Date(value.expiresAt).toISOString() : undefined,
          clickLimit: value.clickLimit ? Number(value.clickLimit) : undefined,
          password: value.password.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setServerError(
          res.status === 409
            ? "That slug is already taken. Try another."
            : res.status === 429
              ? "Too many requests. Please wait and try again."
              : (data.error ?? "Something went wrong")
        );
        return;
      }

      const data = await res.json() as { link: DashboardLink };

      onOpenChange(false);
      form.reset();
      onCreated?.(data.link);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-white/8"
        style={{ background: "oklch(0.12 0 0)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create short link
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Paste a long URL and we&apos;ll create a short link for you.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4 pt-1"
        >
          <form.Field
            name="destination"
            validators={{ onChange: ({ value }) => validateDestinationField(value) }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>
                  Destination URL <span style={{ color: AMBER }}>*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="url"
                  placeholder="https://your-long-url.com/goes/here"
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

          <Separator className="bg-white/6" />

          <form.Field
            name="slug"
            validators={{ onChange: ({ value }) => validateSlugField(value) }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>
                  Custom slug{" "}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </FieldLabel>
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center overflow-hidden rounded-md border border-input bg-transparent text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <span className="shrink-0 border-r border-input px-3 py-2.5 text-muted-foreground text-xs">
                      {SHORT_LINK_DOMAIN}/
                    </span>
                    <input
                      id={field.name}
                      type="text"
                      placeholder="my-link"
                      className="flex-1 bg-transparent px-3 py-2.5 outline-none placeholder:text-muted-foreground/50"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      onBlur={field.handleBlur}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => field.handleChange(generateSlug())}
                    title="Generate random slug"
                  >
                    <Shuffle size={14} />
                  </Button>
                </div>
                {field.state.meta.isTouched && (
                  <FieldError errors={field.state.meta.errors.map((e) => ({ message: String(e) }))} />
                )}
              </Field>
            )}
          </form.Field>

          <form.Field
            name="title"
            validators={{ onChange: ({ value }) => validateTitleField(value) }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>
                  Title{" "}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="text"
                  placeholder="Enter a descriptive title"
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

          <Separator className="bg-white/6" />

          <form.Field
            name="expiresAt"
            validators={{ onChange: ({ value }) => validateExpiresAtField(value) }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>
                  Expires at{" "}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="datetime-local"
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
            name="clickLimit"
            validators={{ onChange: ({ value }) => validateClickLimitField(value) }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>
                  Max clicks{" "}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  min={1}
                  placeholder="e.g. 100"
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
            name="password"
            validators={{ onChange: ({ value }) => validateLinkPasswordField(value) }}
          >
            {(field) => (
              <Field data-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>
                  Password{" "}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Require a password to open this link"
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

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-semibold"
                  style={{ background: AMBER, color: "oklch(0 0 0)" }}
                >
                  {isSubmitting ? "Creating…" : "Create link"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
