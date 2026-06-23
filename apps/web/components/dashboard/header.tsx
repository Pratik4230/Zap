"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut,  Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between border-b border-white/6 px-4 md:px-6"
      style={{ background: "oklch(0.1 0 0 / 80%)" }}
    >
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu size={18} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 border-r border-white/6"
          style={{ background: "oklch(0.1 0 0)" }}>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Page title placeholder — filled by individual pages */}
      <div className="hidden md:block" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5 outline-none">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ background: "oklch(0.769 0.188 70.08 / 20%)", color: "oklch(0.769 0.188 70.08)" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-foreground leading-none">{user?.name ?? "User"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-none">{user?.email ?? ""}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
       
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings size={14} className="mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive"
          >
            <LogOut size={14} className="mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
