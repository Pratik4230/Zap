"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiJson } from "@/lib/api-fetch";
import { toast } from "sonner";
import type { WorkspacePlan, WorkspaceRole } from "@xaply/db";

const AMBER = "oklch(0.769 0.188 70.08)";

type MembersResponse = {
  workspace: {
    id: string;
    name: string;
    plan: WorkspacePlan;
    role: WorkspaceRole;
    isOwner: boolean;
  };
  members: { userId: string; role: WorkspaceRole; name: string; email: string }[];
  invites: { id: string; email: string; role: "admin" | "member"; expiresAt: string }[];
  seats: { used: number; max: number };
};

export function TeamSettingsCard({ userId }: { userId?: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-members"],
    queryFn: () => apiJson<MembersResponse>("/api/workspace/members"),
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiJson("/api/workspace/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      }),
    onSuccess: () => {
      toast.success("Invite sent");
      setEmail("");
      void queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not invite"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) =>
      apiJson(`/api/workspace/invites/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Invite revoked");
      void queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not revoke invite"),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiJson(`/api/workspace/members/${memberId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Member removed");
      void queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not remove member"),
  });

  const canManage = data?.workspace.role === "owner" || data?.workspace.role === "admin";
  const isBusiness = data?.workspace.plan === "business";

  return (
    <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
      <CardHeader className="px-6 pt-5 pb-4">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Users size={16} style={{ color: AMBER }} />
          Team
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {isBusiness
            ? `${data?.seats.used ?? 0} of ${data?.seats.max ?? 50} seats used`
            : "Invite up to 50 teammates on the Business plan"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading team…</p>
        ) : (
          <>
            <ul className="space-y-2">
              {data?.members.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/8 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.email} · {member.role}
                    </p>
                  </div>
                  {canManage && member.role !== "owner" && member.userId !== userId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMutation.mutate(member.userId)}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>

            {data?.invites.length ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pending invites
                </p>
                {data.invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/8 px-3 py-2"
                  >
                    <p className="text-sm text-foreground">
                      {invite.email} · {invite.role}
                    </p>
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeMutation.mutate(invite.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {canManage && isBusiness && (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  inviteMutation.mutate();
                }}
              >
                <Input
                  type="email"
                  placeholder="teammate@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as "admin" | "member")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  disabled={!email.trim() || inviteMutation.isPending}
                  className="font-semibold"
                  style={{ background: AMBER, color: "oklch(0 0 0)" }}
                >
                  {inviteMutation.isPending ? "Sending…" : "Send invite"}
                </Button>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
