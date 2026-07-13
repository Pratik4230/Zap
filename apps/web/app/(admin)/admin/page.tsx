"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LINK_SEARCH_DEBOUNCE_MS } from "@/lib/filter-links";
import { cn } from "@/lib/utils";

const AMBER = "oklch(0.769 0.188 70.08)";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  plan: "free" | "pro" | null;
  totalLinks: number;
  totalClicks: number;
}

interface AdminUsersResponse {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

async function fetchAdminUsers(params: {
  q: string;
  page: number;
}): Promise<AdminUsersResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page > 1) search.set("page", String(params.page));

  const res = await fetch(`/api/admin/users?${search.toString()}`);
  if (res.status === 403) {
    throw new Error("FORBIDDEN");
  }
  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }
  return res.json() as Promise<AdminUsersResponse>;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, LINK_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-users", debouncedSearch, page],
    queryFn: () => fetchAdminUsers({ q: debouncedSearch, page }),
    placeholderData: keepPreviousData,
    retry: (_, err) => !(err instanceof Error && err.message === "FORBIDDEN"),
  });

  useEffect(() => {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      router.replace("/dashboard");
    }
  }, [error, router]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Loading registered users"
              : `${formatNumber(data?.total ?? 0)} users total`}
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name or email"
            className="border-white/6 pl-9"
            style={{ background: "oklch(0.12 0 0)" }}
          />
        </div>
      </div>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Users size={16} style={{ color: AMBER }} />
            All users
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className={cn("transition-opacity", isFetching && !isLoading && "opacity-70")}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/6 hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Links</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <TableRow key={index} className="border-white/6">
                        {Array.from({ length: 7 }).map((__, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-4 w-full max-w-28" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : data?.users.map((user) => (
                      <TableRow key={user.id} className="border-white/6">
                        <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.emailVerified ? "default" : "outline"}>
                            {user.emailVerified ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize"
                            style={
                              user.plan === "pro"
                                ? { borderColor: `${AMBER}55`, color: AMBER }
                                : undefined
                            }
                          >
                            {user.plan ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(user.totalLinks)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(user.totalClicks)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>

            {!isLoading && data?.users.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No users found.
              </div>
            )}
          </div>

          {data && data.total > data.limit && (
            <div className="flex items-center justify-between border-t border-white/6 px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Page {data.page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1 || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasMore || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
