export function buildShortUrl(domain: string, slug: string): string {
  return `https://${domain}/${slug}`;
}

export function qrDownloadFilename(slug: string): string {
  const safe = slug.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `xaply-${safe}-qr.png`;
}
