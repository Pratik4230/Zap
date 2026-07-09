"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
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
import { validateDestinationField, validateTitleField } from "@/lib/validation";

const AMBER = "oklch(0.769 0.188 70.08)";

export interface EditableLink {
  id: string;
  slug: string;
  domain: string;
  destinationUrl: string;
  title: string | null;
}

interface EditLinkDialogProps {
  link: EditableLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: { destinationUrl: string; title: string | null }) => Promise<void>;
  isSaving: boolean;
}

interface EditLinkFormProps {
  link: EditableLink;
  onClose: () => void;
  onSave: (values: { destinationUrl: string; title: string | null }) => Promise<void>;
  isSaving: boolean;
}

function EditLinkForm({ link, onClose, onSave, isSaving }: EditLinkFormProps) {
  const [serverError, setServerError] = useState("");

  const form = useForm({
    defaultValues: {
      destination: link.destinationUrl,
      title: link.title ?? "",
    },
    onSubmit: async ({ value }) => {
      setServerError("");

      const destinationError = validateDestinationField(value.destination);
      const titleError = validateTitleField(value.title);
      if (destinationError || titleError) {
        setServerError(destinationError ?? titleError ?? "Invalid input");
        return;
      }

      try {
        await onSave({
          destinationUrl: value.destination.trim(),
          title: value.title.trim() || null,
        });
      } catch (error) {
        setServerError(error instanceof Error ? error.message : "Something went wrong");
      }
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold text-foreground">
          Edit link
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Update where this short link redirects. Slug and click stats stay the same.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-white/8 bg-white/2 px-3 py-2.5 text-sm">
        <span className="text-muted-foreground">Short URL: </span>
        <span className="font-medium text-foreground">
          {link.domain}/{link.slug}
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
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
                placeholder="https://your-url.com"
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

        {serverError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="font-semibold"
            style={{ background: AMBER, color: "oklch(0 0 0)" }}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </>
  );
}

export function EditLinkDialog({ link, open, onOpenChange, onSave, isSaving }: EditLinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-white/8"
        style={{ background: "oklch(0.12 0 0)" }}
      >
        {link ? (
          <EditLinkForm
            key={link.id}
            link={link}
            onClose={() => onOpenChange(false)}
            onSave={onSave}
            isSaving={isSaving}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
