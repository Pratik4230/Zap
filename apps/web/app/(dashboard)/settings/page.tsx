"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Trash2, LogOut, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AMBER = "oklch(0.769 0.188 70.08)";

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
}

async function fetchSession(): Promise<UserData> {
  const session = await authClient.getSession();
  if (!session.data?.user) throw new Error("Not authenticated");
  return session.data.user as UserData;
}

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["session"], queryFn: fetchSession });

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const profileMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        const d = await res.json() as { error: string };
        throw new Error(d.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Profile updated");
      setName("");
    },
    onError: (e) => toast.error(e.message),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (res.error) throw new Error(res.error.message ?? "Failed to change password");
    },
    onSuccess: () => {
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => toast.error(e.message),
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => router.push("/sign-in"),
    onError: () => toast.error("Failed to sign out"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (deleteConfirm !== user?.email) throw new Error("Email does not match");
      const res = await authClient.deleteUser();
      if (res.error) throw new Error(res.error.message ?? "Failed to delete account");
    },
    onSuccess: () => router.push("/sign-up"),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <User size={16} style={{ color: AMBER }} />
            Profile
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Update your display name
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-foreground">{user?.email ?? "—"}</p>
              {user?.emailVerified && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <ShieldCheck size={12} /> Verified
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Display name
            </label>
            <Input
              placeholder={user?.name ?? "Your name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            disabled={!name.trim() || profileMutation.isPending}
            onClick={() => profileMutation.mutate(name)}
            className="font-semibold"
            style={{ background: AMBER, color: "oklch(0 0 0)" }}
          >
            {profileMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Lock size={16} style={{ color: AMBER }} />
            Password
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Change your account password
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Current password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              New password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Confirm new password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            disabled={!currentPassword || !newPassword || !confirmPassword || passwordMutation.isPending}
            onClick={() => passwordMutation.mutate()}
            variant="outline"
            className="font-semibold"
          >
            {passwordMutation.isPending ? "Updating…" : "Update password"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <LogOut size={16} className="text-muted-foreground" />
            Session
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Button
            variant="outline"
            disabled={signOutMutation.isPending}
            onClick={() => signOutMutation.mutate()}
          >
            {signOutMutation.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-500/20" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
            <Trash2 size={16} />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Permanently delete your account and all links. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-3">
          <Separator className="bg-white/6" />
          <p className="text-sm text-muted-foreground">
            Type your email <span className="font-mono text-foreground">{user?.email}</span> to confirm
          </p>
          <Input
            placeholder={user?.email ?? "your@email.com"}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <Button
            variant="destructive"
            disabled={deleteConfirm !== user?.email || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            className="font-semibold"
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
