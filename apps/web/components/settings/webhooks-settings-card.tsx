"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Webhook } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJson } from "@/lib/api-fetch";
import { toast } from "sonner";
import type { WebhookEvent } from "@xaply/db";

const AMBER = "oklch(0.769 0.188 70.08)";

type WebhookRow = {
  id: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  lastError: string | null;
  secret?: string;
};

type WebhooksResponse = {
  events: WebhookEvent[];
  webhooks: WebhookRow[];
};

export function WebhooksSettingsCard() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<Record<string, string>>({});

  const { data, isError, error } = useQuery({
    queryKey: ["workspace-webhooks"],
    queryFn: () => apiJson<WebhooksResponse>("/api/workspace/webhooks"),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiJson<{ webhook: WebhookRow }>("/api/workspace/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: data?.events }),
      }),
    onSuccess: (result) => {
      toast.success("Webhook created. Copy the secret now");
      setUrl("");
      if (result.webhook.secret) {
        setRevealedSecret((current) => ({ ...current, [result.webhook.id]: result.webhook.secret! }));
      }
      void queryClient.invalidateQueries({ queryKey: ["workspace-webhooks"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not create webhook"),
  });

  const rotateMutation = useMutation({
    mutationFn: (id: string) =>
      apiJson<{ secret: string }>(`/api/workspace/webhooks/${id}/rotate`, { method: "POST" }),
    onSuccess: (result, id) => {
      toast.success("Secret rotated");
      setRevealedSecret((current) => ({ ...current, [id]: result.secret }));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not rotate secret"),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) =>
      apiJson(`/api/workspace/webhooks/${id}/test`, { method: "POST" }),
    onSuccess: () => toast.success("Test event sent"),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Test failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiJson(`/api/workspace/webhooks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Webhook deleted");
      void queryClient.invalidateQueries({ queryKey: ["workspace-webhooks"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not delete webhook"),
  });

  const locked = isError;

  return (
    <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
      <CardHeader className="px-6 pt-5 pb-4">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Webhook size={16} style={{ color: AMBER }} />
          Webhooks
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Receive signed POSTs for link changes and clicks. Business plan only.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        {locked ? (
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Webhooks require a Business workspace."}
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {data?.webhooks.map((hook) => (
                <li key={hook.id} className="space-y-2 rounded-lg border border-white/8 p-3">
                  <p className="break-all text-sm text-foreground">{hook.url}</p>
                  <p className="text-xs text-muted-foreground">{hook.events.join(", ")}</p>
                  {revealedSecret[hook.id] ? (
                    <p className="break-all font-mono text-xs text-amber-300">
                      Secret: {revealedSecret[hook.id]}
                    </p>
                  ) : null}
                  {hook.lastError ? (
                    <p className="text-xs text-destructive">{hook.lastError}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => testMutation.mutate(hook.id)}>
                      Test
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => rotateMutation.mutate(hook.id)}>
                      Rotate secret
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(hook.id)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate();
              }}
            >
              <Input
                type="url"
                placeholder="https://example.com/xaply-webhook"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                required
              />
              <Button
                type="submit"
                disabled={!url.trim() || createMutation.isPending}
                className="font-semibold"
                style={{ background: AMBER, color: "oklch(0 0 0)" }}
              >
                {createMutation.isPending ? "Adding…" : "Add webhook"}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
