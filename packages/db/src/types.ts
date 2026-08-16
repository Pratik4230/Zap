import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  links,
  clicks,
  workspaces,
  users,
  workspaceMembers,
  workspaceInvitations,
  workspaceWebhooks,
} from "./schema";

export type User = InferSelectModel<typeof users>;
export type Workspace = InferSelectModel<typeof workspaces>;
export type Link = InferSelectModel<typeof links>;
export type Click = InferSelectModel<typeof clicks>;

export type NewUser = InferInsertModel<typeof users>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;
export type NewLink = InferInsertModel<typeof links>;
export type NewClick = InferInsertModel<typeof clicks>;
export type WorkspaceMember = InferSelectModel<typeof workspaceMembers>;
export type WorkspaceInvitation = InferSelectModel<typeof workspaceInvitations>;
export type WorkspaceWebhook = InferSelectModel<typeof workspaceWebhooks>;

export interface ClickEvent {
  linkId: string;
  timestamp: number;
  country?: string;
  city?: string;
  device?: "mobile" | "desktop" | "tablet";
  os?: string;
  browser?: string;
  referrer?: string;
}
