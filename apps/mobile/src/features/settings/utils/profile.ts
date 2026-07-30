const NAME_MAX_LENGTH = 100;

/** Client-side mirror of `@xaply/db` `validateProfileName`. */
export function validateProfileName(input: string): string | null {
  const name = input.trim();
  if (!name) return "Name is required";
  if (name.length > NAME_MAX_LENGTH) {
    return `Name must be under ${NAME_MAX_LENGTH} characters`;
  }
  if (!/^[\p{L}\p{N}\s'.-]+$/u.test(name)) {
    return "Name contains invalid characters";
  }
  return null;
}
