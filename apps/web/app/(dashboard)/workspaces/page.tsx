"use client"

import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspacesSettingsCard } from "@/components/settings/workspaces-settings-card"
import { TeamSettingsCard } from "@/components/settings/team-settings-card"
import { WebhooksSettingsCard } from "@/components/settings/webhooks-settings-card"
import { authClient } from "@/lib/auth-client"
import { apiJson } from "@/lib/api-fetch"
import type { WorkspacePlan } from "@xaply/db"

export default function WorkspacesPage() {
  const { data: session } = authClient.useSession()
  const { data: workspace } = useQuery({
    queryKey: ["workspace"],
    queryFn: () =>
      apiJson<{ current: { workspaceName: string; plan: WorkspacePlan } }>(
        "/api/workspace"
      ),
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Workspaces
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {workspace?.current.workspaceName
            ? `You are in ${workspace.current.workspaceName}`
            : "Manage spaces, team, and webhooks"}
        </p>
      </div>

      <Tabs defaultValue="manage" className="gap-4">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <WorkspacesSettingsCard />
        </TabsContent>
        <TabsContent value="team">
          <TeamSettingsCard userId={session?.user?.id} />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksSettingsCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
