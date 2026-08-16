"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJson } from "@/lib/api-fetch";
import { validateProfileNameField } from "@/lib/validation";
import { toast } from "sonner";
import {
  BUSINESS_MAX_OWNED_WORKSPACES,
  MAX_WORKSPACE_MEMBERSHIPS,
  type WorkspacePlan,
  type WorkspaceRole,
} from "@xaply/db";

const AMBER = "oklch(0.769 0.188 70.08)";

type WorkspaceListItem = {
  id: string;
  name: string;
  plan: WorkspacePlan;
  role: WorkspaceRole;
  isOwner: boolean;
  usable: boolean;
};

type WorkspaceResponse = {
  current: {
    workspaceId: string;
    workspaceName: string;
    plan: WorkspacePlan;
    role: WorkspaceRole;
    isOwner: boolean;
  };
  workspaces: WorkspaceListItem[];
  limits: {
    ownedCount: number;
    maxOwned: number;
    membershipCount: number;
    maxMemberships: number;
    canCreate: boolean;
  };
};

export function WorkspacesSettingsCard() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [rename, setRename] = useState("");
  const [nameError, setNameError] = useState("");
  const [renameError, setRenameError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["workspace"],
    queryFn: () => apiJson<WorkspaceResponse>("/api/workspace"),
  });

  const createMutation = useMutation({
    mutationFn: (workspaceName: string) =>
      apiJson("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      }),
    onSuccess: async () => {
      toast.success("Workspace created");
      setName("");
      await queryClient.invalidateQueries();
      window.location.reload();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not create workspace"),
  });

  const renameMutation = useMutation({
    mutationFn: (workspaceName: string) =>
      apiJson("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      }),
    onSuccess: () => {
      toast.success("Workspace renamed");
      setRename("");
      void queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not rename workspace"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiJson(`/api/workspace/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Workspace deleted");
      setConfirmDeleteId(null);
      await queryClient.invalidateQueries();
      window.location.reload();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not delete workspace"),
  });

  const selectMutation = useMutation({
    mutationFn: (workspaceId: string) =>
      apiJson("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      window.location.reload();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not switch workspace"),
  });

  const current = data?.current;
  const owned = data?.workspaces.filter((workspace) => workspace.isOwner) ?? [];
  const joined = data?.workspaces.filter((workspace) => !workspace.isOwner && workspace.usable) ?? [];
  const canCreate = data?.limits.canCreate ?? false;
  const ownerIsBusiness = owned.some((workspace) => workspace.plan === "business");

  return (
    <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
      <CardHeader className="px-6 pt-5 pb-4">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Building2 size={16} style={{ color: AMBER }} />
          Workspaces
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Switch, rename, create, or delete workspaces. Delete also removes that space’s links and members.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading workspaces…</p>
        ) : (
          <>
            <div className="space-y-2">
              {owned.map((workspace) => {
                const isCurrent = workspace.id === current?.workspaceId;
                const canDelete = owned.length > 1;
                return (
                  <div
                    key={workspace.id}
                    className="flex flex-col gap-2 rounded-lg border border-white/8 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {workspace.name}
                        {isCurrent ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">Current</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{workspace.plan}</p>
                    </div>
                    {canDelete ? (
                      confirmDeleteId === workspace.id ? (
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(workspace.id)}
                          >
                            Confirm delete
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          {!isCurrent ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={selectMutation.isPending}
                              onClick={() => selectMutation.mutate(workspace.id)}
                            >
                              Switch
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setConfirmDeleteId(workspace.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )
                    ) : !isCurrent ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectMutation.isPending}
                        onClick={() => selectMutation.mutate(workspace.id)}
                      >
                        Switch
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">Current</p>
                    )}
                  </div>
                );
              })}
            </div>

            {joined.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Joined
                </p>
                {joined.map((workspace) => {
                  const isCurrent = workspace.id === current?.workspaceId;
                  return (
                    <div
                      key={workspace.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/8 px-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{workspace.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{workspace.role}</p>
                      </div>
                      {isCurrent ? (
                        <p className="text-xs text-muted-foreground">Current</p>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={selectMutation.isPending}
                          onClick={() => selectMutation.mutate(workspace.id)}
                        >
                          Switch
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {current?.isOwner ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rename current workspace
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder={current.workspaceName}
                    value={rename}
                    onChange={(event) => {
                      setRename(event.target.value);
                      setRenameError(validateProfileNameField(event.target.value) ?? "");
                    }}
                  />
                  <Button
                    variant="outline"
                    disabled={!rename.trim() || !!renameError || renameMutation.isPending}
                    onClick={() => {
                      const error = validateProfileNameField(rename);
                      if (error) {
                        setRenameError(error);
                        return;
                      }
                      renameMutation.mutate(rename.trim());
                    }}
                  >
                    {renameMutation.isPending ? "Saving…" : "Rename"}
                  </Button>
                </div>
                {renameError ? <p className="text-sm text-destructive">{renameError}</p> : null}
              </div>
            ) : null}

            {ownerIsBusiness ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  New workspace
                </label>
                <p className="text-xs text-muted-foreground">
                  {data?.limits.ownedCount ?? 0} / {data?.limits.maxOwned ?? 0} created ·{" "}
                  {data?.limits.membershipCount ?? 0} / {data?.limits.maxMemberships ?? 0} total
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Marketing"
                    value={name}
                    disabled={!canCreate}
                    onChange={(event) => {
                      setName(event.target.value);
                      setNameError(validateProfileNameField(event.target.value) ?? "");
                    }}
                  />
                  <Button
                    disabled={!canCreate || !name.trim() || !!nameError || createMutation.isPending}
                    onClick={() => {
                      const error = validateProfileNameField(name);
                      if (error) {
                        setNameError(error);
                        return;
                      }
                      createMutation.mutate(name.trim());
                    }}
                    className="font-semibold"
                    style={{ background: AMBER, color: "oklch(0 0 0)" }}
                  >
                    {createMutation.isPending ? "Creating…" : "Create"}
                  </Button>
                </div>
                {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}
                {!canCreate ? (
                  <p className="text-xs text-muted-foreground">
                    {(data?.limits.ownedCount ?? 0) >= (data?.limits.maxOwned ?? BUSINESS_MAX_OWNED_WORKSPACES)
                      ? `You can create at most ${BUSINESS_MAX_OWNED_WORKSPACES} workspaces.`
                      : `You can belong to at most ${MAX_WORKSPACE_MEMBERSHIPS} workspaces.`}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Upgrade to Business to create extra workspaces for clients or teams.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
