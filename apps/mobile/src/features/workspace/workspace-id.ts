import * as SecureStore from "expo-secure-store";

const WORKSPACE_KEY = "xaply_workspace_id";

let memoryWorkspaceId: string | null = null;
let hydratePromise: Promise<void> | null = null;

export const WORKSPACE_HEADER = "x-workspace-id";

export function getWorkspaceIdSync(): string {
  return memoryWorkspaceId ?? "";
}

export async function hydrateWorkspaceId(): Promise<void> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      memoryWorkspaceId = await SecureStore.getItemAsync(WORKSPACE_KEY);
    } catch {
      memoryWorkspaceId = null;
    }
  })();
  return hydratePromise;
}

export async function setWorkspaceId(workspaceId: string): Promise<void> {
  memoryWorkspaceId = workspaceId;
  try {
    await SecureStore.setItemAsync(WORKSPACE_KEY, workspaceId);
  } catch {
    // Memory id still works for this session
  }
}

export async function clearWorkspaceId(): Promise<void> {
  memoryWorkspaceId = null;
  try {
    await SecureStore.deleteItemAsync(WORKSPACE_KEY);
  } catch {
    // ignore
  }
}
