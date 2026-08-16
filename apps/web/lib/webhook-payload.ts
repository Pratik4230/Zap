import type { Link } from "@xaply/db";

export function webhookLinkPayload(link: Link) {
  return {
    id: link.id,
    slug: link.slug,
    domain: link.domain,
    destinationUrl: link.destinationUrl,
    title: link.title,
    status: link.status,
    workspaceId: link.workspaceId,
  };
}
