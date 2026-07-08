"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
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

const AMBER = "oklch(0.769 0.188 70.08)";

const slugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(50, "Slug must be under 50 characters")
  .regex(/^[a-z0-9-_]+$/, "Only lowercase letters, numbers, hyphens and underscores");

const schema = z.object({
  destination: z
    .url("Enter a valid URL (include https://)")
    .min(1, "Destination URL is required"),
  slug: slugSchema.optional().or(z.literal("")),
  title: z.string().max(100, "Title must be under 100 characters").optional(),
});

function generateSlug() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

interface CreateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateLinkDialog({ open, onOpenChange, onCreated }: CreateLinkDialogProps) {
  const [serverError, setServerError] = useState("");

  const form = useForm({
    defaultValues: { destination: "", slug: "", title: "" },
    onSubmit: async ({ value }) => {
      setServerError("");
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationUrl: value.destination,
          slug: value.slug || undefined,
          title: value.title || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setServerError(res.status === 409 ? "That slug is already taken. Try another." : (data.error ?? "Something went wrong"));
        return;
      }
      onOpenChange(false);
      form.reset();
      onCreated?.();
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
          {/* Destination URL */}
          <form.Field
            name="destination"
            validators={{
              onChange: ({ value }) => {
                const r = schema.shape.destination.safeParse(value);
                return r.success ? undefined : r.error.issues[0]?.message;
              },
            }}
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

          {/* Slug */}
          <form.Field
            name="slug"
            validators={{
              onChange: ({ value }) => {
                if (!value) return undefined;
                const r = slugSchema.safeParse(value);
                return r.success ? undefined : r.error.issues[0]?.message;
              },
            }}
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

          {/* Title */}
          <form.Field name="title">
            {(field) => (
              <Field>
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
                />
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
