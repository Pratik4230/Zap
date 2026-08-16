"use client";

import { use, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/api-fetch";
import { toast } from "sonner";

type InvitePreview = {
  workspaceName: string;
  email: string;
  role: string;
  matchesAccount: boolean;
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["invite", token],
    queryFn: () => apiJson<InvitePreview>(`/api/invite/${token}`),
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => apiJson(`/api/invite/${token}`, { method: "POST" }),
    onSuccess: () => {
      setAccepted(true);
      toast.success("You joined the workspace");
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not accept invite"),
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-foreground">Workspace invite</h1>
      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading invite…</p>
      ) : error ? (
        <p className="mt-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Invite not found or expired"}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Join <span className="text-foreground">{data?.workspaceName}</span> as {data?.role}.
          </p>
          {!data?.matchesAccount && (
            <p className="text-sm text-destructive">
              Sign in as {data?.email} to accept this invite.
            </p>
          )}
          <Button
            disabled={!data?.matchesAccount || acceptMutation.isPending || accepted}
            onClick={() => acceptMutation.mutate()}
            className="font-semibold"
            style={{ background: "oklch(0.769 0.188 70.08)", color: "oklch(0 0 0)" }}
          >
            {acceptMutation.isPending ? "Joining…" : "Accept invite"}
          </Button>
        </div>
      )}
    </div>
  );
}
