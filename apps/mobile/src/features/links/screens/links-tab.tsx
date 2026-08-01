import { useCallback, useMemo, useState } from "react";
import { Share } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import {
  Button,
  Column,
  FilterChip,
  FilledTonalIconButton,
  FlowRow,
  Host,
  Icon,
  IconButton,
  LazyColumn,
  ListItem,
  ModalBottomSheet,
  OutlinedTextField,
  PullToRefreshBox,
  Row,
  Text,
  TextButton,
  useNativeState,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  onVisibilityChanged,
  padding,
  paddingAll,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import LinkIcon from "@expo/material-symbols/link.xml";
import SettingsIcon from "@expo/material-symbols/settings.xml";
import { LinkRow } from "@/features/links/components/link-row";
import { LinkQrModal } from "@/features/links/components/link-qr-modal";
import { useLinksInfinite } from "@/features/links/hooks/use-links-infinite";
import {
  LINK_SEARCH_DEBOUNCE_MS,
  SORT_OPTIONS,
  STATUS_FILTERS,
  buildShortUrl,
  formatClickCount,
} from "@/features/links/utils/format";
import { getApiErrorMessage } from "@/global/api/errors";
import { apiClient } from "@/global/api/client";
import { queryKeys } from "@/global/api/query-keys";
import type {
  CreateLinkInput,
  LinkSortOption,
  LinkStatusFilter,
} from "@/global/api/types";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/global/components/query-state";
import { ScreenShell } from "@/global/components/screen-shell";
import { toast } from "@/global/components/toast";
import { colors } from "@/global/theme";
import { useDebouncedValue } from "@/global/utils/use-debounced-value";
import { useIsOnline } from "@/global/utils/network";

function StatCard({
  label,
  value,
  weightModifier,
}: {
  label: string;
  value: string;
  weightModifier?: ReturnType<typeof weight>;
}) {
  return (
    <ListItem
      colors={{
        containerColor: colors.surface,
        contentColor: colors.foreground,
        supportingContentColor: colors.muted,
      }}
      modifiers={weightModifier ? [weightModifier] : undefined}
    >
      <ListItem.HeadlineContent>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>{value}</Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Text style={{ fontSize: 12 }}>{label}</Text>
      </ListItem.SupportingContent>
    </ListItem>
  );
}

/**
 * Links tab — search/filter + create + infinite scroll + pull-to-refresh.
 */
export default function LinksTabScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const online = useIsOnline();
  const searchField = useNativeState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, LINK_SEARCH_DEBOUNCE_MS);
  const [status, setStatus] = useState<LinkStatusFilter>("all");
  const [sort, setSort] = useState<LinkSortOption>("newest");
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [serverError, setServerError] = useState("");

  const destinationState = useNativeState("");
  const slugState = useNativeState("");
  const titleState = useNativeState("");
  const editTitleState = useNativeState("");
  const editDestinationState = useNativeState("");

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
  } = useQuery({
    queryKey: queryKeys.links.summary,
    queryFn: () => apiClient.links.summary(),
  });

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useLinksInfinite({
    q: debouncedSearch,
    status,
    sort,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateLinkInput) => apiClient.links.create(payload),
    onSuccess: async () => {
      destinationState.set("");
      slugState.set("");
      titleState.set("");
      setServerError("");
      setShowCreateSheet(false);
      toast("Link created");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.links.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.links.summary }),
      ]);
    },
    onError: (createError) => {
      const message = getApiErrorMessage(createError);
      setServerError(message);
      toast(message, "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      title: string;
      destinationUrl: string;
      status?: "active" | "paused";
    }) =>
      apiClient.links.update(payload.id, {
        title: payload.title || null,
        destinationUrl: payload.destinationUrl,
        status: payload.status,
      }),
    onSuccess: async () => {
      setServerError("");
      toast("Link updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.links.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.links.summary }),
      ]);
      setEditingLinkId(null);
    },
    onError: (updateError) => {
      setServerError(getApiErrorMessage(updateError));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.links.delete(id),
    onSuccess: async () => {
      setServerError("");
      toast("Link deleted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.links.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.links.summary }),
      ]);
      setEditingLinkId(null);
    },
    onError: (deleteError) => {
      setServerError(getApiErrorMessage(deleteError));
    },
  });

  const links = useMemo(
    () => data?.pages.flatMap((page) => page.links) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;
  const isSearchPending = search !== debouncedSearch;
  const showInitialLoading =
    (isLoading || isSearchPending) && links.length === 0;
  const hasActiveFilters = debouncedSearch.length > 0 || status !== "all";
  const editingLink = useMemo(
    () => links.find((link) => link.id === editingLinkId) ?? null,
    [links, editingLinkId],
  );

  const onRefresh = useCallback(() => {
    void Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: queryKeys.links.summary }),
    ]);
  }, [queryClient, refetch]);

  const loadMoreIfNeeded = useCallback(
    (isVisible: boolean) => {
      if (isVisible && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  function clearFilters() {
    searchField.set("");
    setSearch("");
    setStatus("all");
    setSort("newest");
  }

  async function onCreateLink() {
    setServerError("");
    if (!online) {
      setServerError("You’re offline. Reconnect to create a link.");
      return;
    }
    const destinationUrl = destinationState.get().trim();
    if (!destinationUrl) {
      setServerError("Destination URL is required");
      return;
    }

    await createMutation.mutateAsync({
      destinationUrl,
      slug: slugState.get().trim() || undefined,
      title: titleState.get().trim() || undefined,
    });
  }

  function openEditSheet(linkId: string) {
    const link = links.find((item) => item.id === linkId);
    if (!link) return;
    editTitleState.set(link.title ?? "");
    editDestinationState.set(link.destinationUrl);
    setServerError("");
    setShowQr(false);
    setEditingLinkId(link.id);
  }

  async function saveEdit() {
    if (!editingLink) return;
    if (!online) {
      setServerError("You’re offline. Reconnect to save changes.");
      return;
    }
    const nextUrl = editDestinationState.get().trim();
    if (!nextUrl) {
      setServerError("Destination URL is required");
      return;
    }
    await updateMutation.mutateAsync({
      id: editingLink.id,
      title: editTitleState.get().trim(),
      destinationUrl: nextUrl,
    });
  }

  async function toggleStatus() {
    if (!editingLink) return;
    if (!online) {
      setServerError("You’re offline. Reconnect to update status.");
      return;
    }
    await updateMutation.mutateAsync({
      id: editingLink.id,
      title: editTitleState.get().trim(),
      destinationUrl: editDestinationState.get().trim(),
      status: editingLink.status === "active" ? "paused" : "active",
    });
  }

  async function removeLink() {
    if (!editingLink) return;
    if (!online) {
      setServerError("You’re offline. Reconnect to delete this link.");
      return;
    }
    await deleteMutation.mutateAsync(editingLink.id);
  }

  async function copyShortUrl() {
    if (!editingLink) return;
    await Clipboard.setStringAsync(
      buildShortUrl(editingLink.domain, editingLink.slug),
    );
    toast("Link copied");
  }

  async function shareShortUrl() {
    if (!editingLink) return;
    const shortUrl = buildShortUrl(editingLink.domain, editingLink.slug);
    await Share.share({ message: shortUrl, url: shortUrl });
  }

  const subtitle = showInitialLoading
    ? "Loading your links..."
    : total > 0
      ? `${total} links · Tap for analytics to manage`
      : hasActiveFilters
        ? "No links match these filters"
        : "No links yet";

  return (
    <ScreenShell>
      <Host
        colorScheme="dark"
        seedColor={colors.primary}
        style={{ flex: 1, width: "100%" }}
      >
        <Column
          modifiers={[fillMaxSize(), fillMaxWidth(), padding(0, 2, 0, 8)]}
          verticalArrangement={{ spacedBy: 10 }}
        >
          <Column
            verticalArrangement={{ spacedBy: 3 }}
            modifiers={[fillMaxWidth(), padding(14, 0, 14, 0)]}
          >
            <Text
              color={colors.foreground}
              style={{ fontSize: 22, fontWeight: "700" }}
            >
              Links
            </Text>
            <Text color={colors.muted} style={{ fontSize: 13 }}>
              {subtitle}
            </Text>
          </Column>

          <Row
            horizontalArrangement={{ spacedBy: 8 }}
            modifiers={[fillMaxWidth(), padding(14, 0, 14, 0)]}
          >
            <StatCard
              label="Total links"
              value={
                isSummaryLoading || isSummaryFetching
                  ? "..."
                  : String(summary?.totalLinks ?? 0)
              }
              weightModifier={weight(1)}
            />
            <StatCard
              label="Total clicks"
              value={
                isSummaryLoading || isSummaryFetching
                  ? "..."
                  : formatClickCount(summary?.totalClicks ?? 0)
              }
              weightModifier={weight(1)}
            />
            <StatCard
              label="Active rate"
              value={
                isSummaryLoading || isSummaryFetching
                  ? "..."
                  : `${Math.round(summary?.activeRate ?? 0)}%`
              }
              weightModifier={weight(1)}
            />
          </Row>

          <Row
            horizontalArrangement={{ spacedBy: 8 }}
            modifiers={[fillMaxWidth(), padding(14, 0, 14, 0)]}
          >
            <Button
              onClick={() => setShowCreateSheet(true)}
              colors={{
                containerColor: colors.primary,
                contentColor: colors.primaryForeground,
              }}
              modifiers={[weight(1)]}
            >
              <Row
                verticalAlignment="center"
                horizontalArrangement={{ spacedBy: 8 }}
              >
                <Icon
                  source={LinkIcon}
                  size={18}
                  tint={colors.primaryForeground}
                />
                <Text>Create</Text>
              </Row>
            </Button>

            <FilledTonalIconButton
              onClick={() => setShowFilterSheet(true)}
              colors={{
                containerColor: hasActiveFilters ? "#3d2a00" : colors.surface,
                contentColor: hasActiveFilters
                  ? colors.primary
                  : colors.foreground,
              }}
            >
              <Icon
                source={SettingsIcon}
                size={18}
                tint={hasActiveFilters ? colors.primary : colors.foreground}
              />
            </FilledTonalIconButton>
          </Row>

          <OutlinedTextField
            value={searchField}
            singleLine
            maxLength={100}
            onValueChange={(value) => {
              setSearch(value);
            }}
            keyboardOptions={{
              keyboardType: "text",
              capitalization: "none",
              autoCorrectEnabled: false,
              imeAction: "search",
            }}
            modifiers={[fillMaxWidth(), padding(14, 0, 14, 0)]}
          >
            <OutlinedTextField.Label>
              <Text>Search</Text>
            </OutlinedTextField.Label>
            <OutlinedTextField.Placeholder>
              <Text>Slug, title, or destination</Text>
            </OutlinedTextField.Placeholder>
          </OutlinedTextField>

          {hasActiveFilters ? (
            <TextButton
              contentPadding={{ start: 0, top: 0, end: 0, bottom: 0 }}
              onClick={clearFilters}
              modifiers={[padding(14, 0, 14, 0)]}
            >
              <Text color={colors.primary} style={{ fontSize: 13 }}>
                Clear filters
              </Text>
            </TextButton>
          ) : null}

          {error ? (
            <ErrorState
              padded
              message={getApiErrorMessage(error)}
              onRetry={() => void refetch()}
            />
          ) : null}

          <PullToRefreshBox
            isRefreshing={isRefetching && !isFetchingNextPage}
            onRefresh={onRefresh}
            contentAlignment="topCenter"
            indicator={{
              color: colors.primary,
              containerColor: colors.background,
            }}
            modifiers={[fillMaxWidth(), weight(1)]}
          >
            <LazyColumn
              verticalArrangement={{ spacedBy: 8 }}
              contentPadding={{ bottom: 16 }}
              modifiers={[fillMaxSize()]}
            >
              {showInitialLoading ? (
                <LoadingState message="Loading..." />
              ) : null}

              {!showInitialLoading && links.length === 0 && !error ? (
                <EmptyState
                  title={hasActiveFilters ? "No matches" : "No links yet"}
                  description={
                    hasActiveFilters
                      ? "Try a different search or status filter."
                      : "Create your first short link above."
                  }
                />
              ) : null}

              {links.map((link) => (
                <LinkRow
                  key={link.id}
                  link={link}
                  onPress={() => router.push(`/links/${link.id}/analytics`)}
                  onManage={() => openEditSheet(link.id)}
                />
              ))}

              {hasNextPage ? (
                <ListItem
                  colors={{
                    containerColor: colors.background,
                    contentColor: colors.muted,
                  }}
                  modifiers={[
                    onVisibilityChanged(loadMoreIfNeeded, {
                      minFractionVisible: 0.2,
                      minDurationMs: 120,
                    }),
                  ]}
                >
                  <ListItem.HeadlineContent>
                    <Text>
                      {isFetchingNextPage
                        ? "Loading more..."
                        : "Scroll for more"}
                    </Text>
                  </ListItem.HeadlineContent>
                </ListItem>
              ) : null}

              {!hasNextPage && links.length > 0 && !isFetching ? (
                <ListItem
                  colors={{
                    containerColor: colors.background,
                    contentColor: colors.muted,
                  }}
                >
                  <ListItem.HeadlineContent>
                    <Text style={{ fontSize: 12 }}>End of list</Text>
                  </ListItem.HeadlineContent>
                </ListItem>
              ) : null}
            </LazyColumn>
          </PullToRefreshBox>
        </Column>

        {showCreateSheet ? (
          <ModalBottomSheet
            onDismissRequest={() => setShowCreateSheet(false)}
            containerColor={colors.surface}
            contentColor={colors.foreground}
            showDragHandle
          >
            <Column
              verticalArrangement={{ spacedBy: 10 }}
              modifiers={[fillMaxWidth(), paddingAll(14)]}
            >
              <Text style={{ fontSize: 20, fontWeight: "700" }}>
                Create link
              </Text>

              <OutlinedTextField
                value={destinationState}
                singleLine
                keyboardOptions={{ keyboardType: "text", imeAction: "next" }}
                modifiers={[fillMaxWidth()]}
              >
                <OutlinedTextField.Label>
                  <Text>Destination URL</Text>
                </OutlinedTextField.Label>
                <OutlinedTextField.Placeholder>
                  <Text>https://example.com</Text>
                </OutlinedTextField.Placeholder>
              </OutlinedTextField>

              <OutlinedTextField
                value={slugState}
                singleLine
                modifiers={[fillMaxWidth()]}
              >
                <OutlinedTextField.Label>
                  <Text>Custom slug (optional)</Text>
                </OutlinedTextField.Label>
              </OutlinedTextField>

              <OutlinedTextField
                value={titleState}
                singleLine
                modifiers={[fillMaxWidth()]}
              >
                <OutlinedTextField.Label>
                  <Text>Title (optional)</Text>
                </OutlinedTextField.Label>
              </OutlinedTextField>

              {serverError ? (
                <Text color={colors.destructive}>{serverError}</Text>
              ) : null}

              <Button
                enabled={!createMutation.isPending}
                onClick={() => void onCreateLink()}
                colors={{
                  containerColor: colors.primary,
                  contentColor: colors.primaryForeground,
                }}
                modifiers={[fillMaxWidth()]}
              >
                <Text>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Text>
              </Button>
            </Column>
          </ModalBottomSheet>
        ) : null}

        {showFilterSheet ? (
          <ModalBottomSheet
            onDismissRequest={() => setShowFilterSheet(false)}
            containerColor={colors.surface}
            contentColor={colors.foreground}
            showDragHandle
          >
            <Column
              verticalArrangement={{ spacedBy: 12 }}
              modifiers={[fillMaxWidth(), paddingAll(14)]}
            >
              <Row
                horizontalArrangement="spaceBetween"
                verticalAlignment="center"
                modifiers={[fillMaxWidth()]}
              >
                <Text style={{ fontSize: 20, fontWeight: "700" }}>Filters</Text>
                <IconButton onClick={() => setShowFilterSheet(false)}>
                  <Icon
                    source={SettingsIcon}
                    size={18}
                    tint={colors.foreground}
                  />
                </IconButton>
              </Row>

              <Text style={{ fontSize: 13, fontWeight: "600" }}>Status</Text>
              <FlowRow
                horizontalArrangement={{ spacedBy: 8 }}
                verticalArrangement={{ spacedBy: 8 }}
              >
                {STATUS_FILTERS.map((option) => (
                  <FilterChip
                    key={option.value}
                    selected={status === option.value}
                    onClick={() => setStatus(option.value)}
                    colors={{
                      selectedContainerColor: colors.primary,
                      selectedLabelColor: colors.primaryForeground,
                      labelColor: colors.muted,
                      containerColor: colors.background,
                    }}
                  >
                    <FilterChip.Label>
                      <Text>{option.label}</Text>
                    </FilterChip.Label>
                  </FilterChip>
                ))}
              </FlowRow>

              <Text style={{ fontSize: 13, fontWeight: "600" }}>Sort</Text>
              <FlowRow
                horizontalArrangement={{ spacedBy: 8 }}
                verticalArrangement={{ spacedBy: 8 }}
              >
                {SORT_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    selected={sort === option.value}
                    onClick={() => setSort(option.value)}
                    colors={{
                      selectedContainerColor: "#3d2a00",
                      selectedLabelColor: colors.primary,
                      labelColor: colors.muted,
                      containerColor: colors.background,
                    }}
                  >
                    <FilterChip.Label>
                      <Text>{option.label}</Text>
                    </FilterChip.Label>
                  </FilterChip>
                ))}
              </FlowRow>

              <Row horizontalArrangement={{ spacedBy: 10 }}>
                <Button
                  onClick={() => {
                    clearFilters();
                    setShowFilterSheet(false);
                  }}
                  colors={{
                    containerColor: colors.background,
                    contentColor: colors.foreground,
                  }}
                  modifiers={[weight(1)]}
                >
                  <Text>Clear</Text>
                </Button>
                <Button
                  onClick={() => setShowFilterSheet(false)}
                  colors={{
                    containerColor: colors.primary,
                    contentColor: colors.primaryForeground,
                  }}
                  modifiers={[weight(1)]}
                >
                  <Text>Done</Text>
                </Button>
              </Row>
            </Column>
          </ModalBottomSheet>
        ) : null}

        {editingLink ? (
          <ModalBottomSheet
            onDismissRequest={() => {
              setShowQr(false);
              setEditingLinkId(null);
            }}
            containerColor={colors.surface}
            contentColor={colors.foreground}
            showDragHandle
          >
            <Column
              verticalArrangement={{ spacedBy: 10 }}
              modifiers={[fillMaxWidth(), paddingAll(14)]}
            >
              <Text style={{ fontSize: 20, fontWeight: "700" }}>
                Manage link
              </Text>
              <Text
                color={colors.muted}
              >{`${editingLink.domain}/${editingLink.slug}`}</Text>

              <OutlinedTextField
                value={editTitleState}
                singleLine
                modifiers={[fillMaxWidth()]}
              >
                <OutlinedTextField.Label>
                  <Text>Title</Text>
                </OutlinedTextField.Label>
              </OutlinedTextField>

              <OutlinedTextField
                value={editDestinationState}
                singleLine
                keyboardOptions={{ keyboardType: "text", imeAction: "done" }}
                modifiers={[fillMaxWidth()]}
              >
                <OutlinedTextField.Label>
                  <Text>Destination URL</Text>
                </OutlinedTextField.Label>
              </OutlinedTextField>

              {serverError ? (
                <Text color={colors.destructive}>{serverError}</Text>
              ) : null}

              <Row horizontalArrangement={{ spacedBy: 10 }}>
                <Button
                  onClick={() => void copyShortUrl()}
                  enabled={
                    !updateMutation.isPending && !deleteMutation.isPending
                  }
                  colors={{
                    containerColor: colors.background,
                    contentColor: colors.foreground,
                  }}
                  modifiers={[weight(1)]}
                >
                  <Text>Copy</Text>
                </Button>
                <Button
                  onClick={() => void shareShortUrl()}
                  enabled={
                    !updateMutation.isPending && !deleteMutation.isPending
                  }
                  colors={{
                    containerColor: colors.background,
                    contentColor: colors.foreground,
                  }}
                  modifiers={[weight(1)]}
                >
                  <Text>Share</Text>
                </Button>
                <Button
                  onClick={() => setShowQr(true)}
                  enabled={
                    !updateMutation.isPending && !deleteMutation.isPending
                  }
                  colors={{
                    containerColor: colors.background,
                    contentColor: colors.foreground,
                  }}
                  modifiers={[weight(1)]}
                >
                  <Text>QR</Text>
                </Button>
              </Row>

              <Row horizontalArrangement={{ spacedBy: 10 }}>
                <Button
                  onClick={() => void saveEdit()}
                  enabled={
                    !updateMutation.isPending && !deleteMutation.isPending
                  }
                  colors={{
                    containerColor: colors.primary,
                    contentColor: colors.primaryForeground,
                  }}
                  modifiers={[weight(1)]}
                >
                  <Text>{updateMutation.isPending ? "Saving..." : "Save"}</Text>
                </Button>
                <Button
                  onClick={() => void toggleStatus()}
                  enabled={
                    !updateMutation.isPending && !deleteMutation.isPending
                  }
                  colors={{
                    containerColor: "#3d2a00",
                    contentColor: colors.primary,
                  }}
                  modifiers={[weight(1)]}
                >
                  <Text>
                    {editingLink.status === "active" ? "Pause" : "Resume"}
                  </Text>
                </Button>
              </Row>

              <Button
                onClick={() => void removeLink()}
                enabled={!updateMutation.isPending && !deleteMutation.isPending}
                colors={{
                  containerColor: colors.destructive,
                  contentColor: colors.foreground,
                }}
                modifiers={[fillMaxWidth()]}
              >
                <Text>
                  {deleteMutation.isPending ? "Deleting..." : "Delete link"}
                </Text>
              </Button>
            </Column>
          </ModalBottomSheet>
        ) : null}
      </Host>

      {editingLink && showQr ? (
        <LinkQrModal
          visible
          domain={editingLink.domain}
          slug={editingLink.slug}
          title={editingLink.title}
          onClose={() => setShowQr(false)}
        />
      ) : null}
    </ScreenShell>
  );
}
