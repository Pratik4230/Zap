import {
  validateClickLimit,
  validateDestinationUrl,
  validateExpiresAt,
  validateLinkPassword,
  validateProfileName,
  validateSlug,
  validateTitle,
} from "@xaply/db";

function fieldError(result: { ok: boolean; error?: string }): string | undefined {
  return result.ok ? undefined : result.error;
}

export function validateDestinationField(value: string): string | undefined {
  return fieldError(validateDestinationUrl(value));
}

export function validateSlugField(value: string): string | undefined {
  if (!value) return undefined;
  return fieldError(validateSlug(value));
}

export function validateTitleField(value: string): string | undefined {
  return fieldError(validateTitle(value));
}

export function validateProfileNameField(value: string): string | undefined {
  return fieldError(validateProfileName(value));
}

export function validateExpiresAtField(value: string): string | undefined {
  return fieldError(validateExpiresAt(value));
}

export function validateClickLimitField(value: string): string | undefined {
  return fieldError(validateClickLimit(value));
}

export function validateLinkPasswordField(value: string): string | undefined {
  if (!value) return undefined;
  return fieldError(validateLinkPassword(value));
}

/** Format a Date for `<input type="datetime-local" />` */
export function toDatetimeLocalValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
