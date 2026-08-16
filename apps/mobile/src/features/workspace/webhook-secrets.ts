const secrets = new Map<string, string>();

export function rememberWebhookSecret(id: string, secret: string) {
  secrets.set(id, secret);
}

export function peekWebhookSecret(id: string): string | undefined {
  return secrets.get(id);
}

export function forgetWebhookSecret(id: string) {
  secrets.delete(id);
}
