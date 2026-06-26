"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COPY } from "@/config/constants";

// Three-tab browser shown over a community's detail pane (or a single chat).
// Pulls media/docs/links from a per-chat or per-community list endpoint;
// later phases wire the actual data fetch.
export function CommunityMediaBrowser({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{COPY.COMMUNITIES_MEDIA_TITLE}</DialogTitle>
          <DialogDescription>
            {COPY.COMMUNITIES_MEDIA_SUBTITLE}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="media" className="px-6 pb-6">
          <TabsList>
            <TabsTrigger value="media">
              {COPY.COMMUNITIES_TAB_MEDIA}
            </TabsTrigger>
            <TabsTrigger value="docs">
              {COPY.COMMUNITIES_TAB_DOCS}
            </TabsTrigger>
            <TabsTrigger value="links">
              {COPY.COMMUNITIES_TAB_LINKS}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="mt-4 h-96">
            <TabsContent value="media" className="mt-0">
              <p className="px-2 py-12 text-center text-sm text-wa-text-muted">
                Media will appear here.
              </p>
            </TabsContent>
            <TabsContent value="docs" className="mt-0">
              <p className="px-2 py-12 text-center text-sm text-wa-text-muted">
                Shared documents will appear here.
              </p>
            </TabsContent>
            <TabsContent value="links" className="mt-0">
              <p className="px-2 py-12 text-center text-sm text-wa-text-muted">
                Shared links will appear here.
              </p>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
