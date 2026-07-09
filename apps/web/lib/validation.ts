import {
  validateDestinationUrl,
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
