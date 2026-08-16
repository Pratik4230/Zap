"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api-fetch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkspacePlan, WorkspaceRole } from "@xaply/db";

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
  };
  workspaces: WorkspaceListItem[];
};

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["workspace"],
    queryFn: () => apiJson<WorkspaceResponse>("/api/workspace"),
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
  const usable = data?.workspaces.filter((workspace) => workspace.usable) ?? [];
  if (!current || usable.length <= 1) return null;

  return (
    <div className={cn("px-3 pb-2", className)}>
      <label className="sr-only" htmlFor="workspace-switcher">
        Workspace
      </label>
      <Select
        value={current.workspaceId}
        disabled={selectMutation.isPending}
        onValueChange={(workspaceId) => {
          if (workspaceId !== current.workspaceId) {
            selectMutation.mutate(workspaceId);
          }
        }}
      >
        <SelectTrigger id="workspace-switcher" className="h-10 w-full rounded-lg">
          <SelectValue placeholder="Workspace" />
        </SelectTrigger>
        <SelectContent>
          {usable.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              {workspace.name}
              {workspace.isOwner ? "" : ` (${workspace.role})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
