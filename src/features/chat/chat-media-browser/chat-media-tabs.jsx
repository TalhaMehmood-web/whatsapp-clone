"use client";

import { Download, ExternalLink, Loader2, Play } from "lucide-react";
import { format } from "date-fns";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatMediaQuery } from "@/tanstack/chat/queries";
import { useUiStore } from "@/stores/ui-store";
import { COPY } from "@/config/constants";
import { MessageType } from "@/models/enums";
import { messageTime } from "@/utils/date-format";
import { documentIcon } from "@/utils/document-icon";
import { downloadCloudinaryUrl } from "@/utils/cloudinary-url";
import { cn } from "@/utils/cn";

// Media / Docs / Links tabs for a single chat. Pulled out of the
// (deleted) ChatMediaBrowser sheet so the same content can render inside
// a full-screen route layout (/chat/[id]/media). The route handles its
// own header — this component is just the scrollable tabbed body.
//
// `enabled` lets a caller defer the query until the surface is actually
// on-screen (mobile route transitions, lazy loading, etc.).
export function ChatMediaTabs({ chatId, enabled = true }) {
  const openLightbox = useUiStore((s) => s.openLightbox);
  const openDocPreview = useUiStore((s) => s.openDocPreview);
  const { data, isLoading } = useChatMediaQuery(chatId, { enabled });

  const media = data?.media ?? [];
  const docs = data?.docs ?? [];
  const links = data?.links ?? [];

  const openMediaAt = (id) => {
    const items = media.filter((m) => !m.deletedAt && m.mediaUrl).reverse();
    const index = Math.max(0, items.findIndex((m) => m.id === id));
    openLightbox({ items, index });
  };

  return (
    <Tabs
      defaultValue="media"
      className="flex h-full min-h-0 flex-col"
    >
      {/* Sticky tabs so the user always has the section switcher
          available while scrolling a long list. */}
      <div className="sticky top-0 z-10 border-b border-wa-border bg-wa-panel px-2 pt-2">
        <TabsList className="grid w-full grid-cols-3 bg-transparent">
          <TabsTrigger value="media">{COPY.COMMUNITIES_TAB_MEDIA}</TabsTrigger>
          <TabsTrigger value="docs">{COPY.COMMUNITIES_TAB_DOCS}</TabsTrigger>
          <TabsTrigger value="links">{COPY.COMMUNITIES_TAB_LINKS}</TabsTrigger>
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-10 text-wa-text-muted">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="media" className="mt-0 px-2 pb-6 pt-3">
              <MediaGrid items={media} onOpen={openMediaAt} />
            </TabsContent>
            <TabsContent value="docs" className="mt-0 px-2 pb-6 pt-3">
              <DocsList items={docs} onOpen={openDocPreview} />
            </TabsContent>
            <TabsContent value="links" className="mt-0 px-2 pb-6 pt-3">
              <LinksList items={links} />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
}

function MediaGrid({ items, onOpen }) {
  if (items.length === 0) return <EmptyState label="No photos or videos yet." />;
  const groups = groupByDate(items);
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="px-1 pb-2 text-[11px] uppercase tracking-wider text-wa-text-muted">
            {group.label}
          </h3>
          {/* 3 columns on phones, 4 on small tablets, 5 on desktops so
              tiles never get cartoonishly large on a wide page. */}
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-5">
            {group.items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onOpen(m.id)}
                className="relative aspect-square overflow-hidden rounded-md bg-wa-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-green"
              >
                {m.type === MessageType.VIDEO ? (
                  <>
                    <video
                      src={m.mediaUrl}
                      preload="metadata"
                      playsInline
                      muted
                      className="size-full object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/30">
                      <Play className="size-5 text-white" />
                    </span>
                  </>
                ) : (
                  <img
                    src={m.mediaUrl}
                    alt={m.caption ?? ""}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DocsList({ items, onOpen }) {
  if (items.length === 0) return <EmptyState label="No documents yet." />;
  return (
    <ul className="flex flex-col">
      {items.map((doc) => {
        const { Icon, accent } = documentIcon({
          mime: doc.mediaMime,
          fileName: doc.fileName,
        });
        return (
          <li key={doc.id} className="flex items-center gap-1 pr-1">
            <button
              type="button"
              onClick={() =>
                onOpen({
                  mediaUrl: doc.mediaUrl,
                  mediaMime: doc.mediaMime,
                  fileName: doc.fileName,
                })
              }
              className="flex flex-1 items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-wa-panel-2"
            >
              <Icon className={cn("size-8 shrink-0", accent)} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-wa-text">
                  {doc.fileName ?? "Document"}
                </span>
                <span className="truncate text-xs text-wa-text-muted">
                  {doc.sender?.name ?? "Unknown"} · {messageTime(doc.createdAt)}
                </span>
              </div>
            </button>
            <a
              href={downloadCloudinaryUrl(doc.mediaUrl, doc.fileName)}
              rel="noreferrer"
              aria-label="Download"
              className="grid size-8 place-items-center rounded-md text-wa-text-muted transition-colors hover:bg-wa-panel-2 hover:text-wa-text"
            >
              <Download className="size-4" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function LinksList({ items }) {
  if (items.length === 0) return <EmptyState label="No links yet." />;
  return (
    <ul className="flex flex-col">
      {items.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-wa-panel-2"
          >
            <ExternalLink className="mt-0.5 size-5 shrink-0 text-wa-text-muted" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-wa-green">{link.url}</span>
              <span className="truncate text-xs text-wa-text-muted">
                {link.sender?.name ?? "Unknown"} · {messageTime(link.createdAt)}
              </span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ label }) {
  return (
    <p className="px-3 py-10 text-center text-sm text-wa-text-muted">{label}</p>
  );
}

function groupByDate(items) {
  const out = new Map();
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const item of items) {
    const d = startOfDay(new Date(item.createdAt));
    const label =
      d.getTime() === today.getTime()
        ? "Today"
        : d.getTime() === yesterday.getTime()
          ? "Yesterday"
          : format(d, "d MMMM yyyy");
    if (!out.has(label)) out.set(label, []);
    out.get(label).push(item);
  }
  return [...out.entries()].map(([label, items]) => ({ label, items }));
}

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
