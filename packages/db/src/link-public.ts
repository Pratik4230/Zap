import type { Link } from "./types";
import { linkHasPassword } from "./link-password";

export type PublicLink = Omit<Link, "passwordHash"> & { hasPassword: boolean };

export function toPublicLink(link: Link): PublicLink {
  const { passwordHash: _passwordHash, ...rest } = link;
  return {
    ...rest,
    hasPassword: linkHasPassword(link),
  };
}

export function toPublicLinks(links: Link[]): PublicLink[] {
  return links.map(toPublicLink);
}
