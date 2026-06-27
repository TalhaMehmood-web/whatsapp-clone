"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSocketStore } from "@/stores/socket-store";
import { queryKeys } from "@/config/query-keys";
import { SOCKET_EVENT } from "@/config/constants";

// Listens for USER_PROFILE_UPDATED on the user's private channel and
// walks every cache slice that might embed a stale copy of the updated
// user (name / avatar / about). The same field set the
// `lib/me-profile.js → updateMe` fanout broadcasts.
//
// Why this exists: the IndexedDB-persisted React Query cache is great
// for warm reloads, but it has no idea that User A's avatar changed.
// Without this hook, peers see the stale avatar in chat lists, chat
// headers, group-member sheets, message bubble senders, etc. until
// they re-login. The fanout + this patcher fix that.
//
// The patching surface is broad on purpose — every cache shape that
// could carry an embedded `{ id, name, avatar, about }` sub-object
// gets visited. Each pass is a cheap structural patch; we only
// re-write a cache entry if it actually contained the target user.
export function useUserProfileSync() {
  const socket = useSocketStore((s) => s.socket);
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const onUpdate = (payload) => {
      if (!payload?.id) return;
      const { id, name, avatar, about } = payload;
      const patchUser = (u) =>
        u && u.id === id ? { ...u, name, avatar, about } : u;

      // 1) Public profile keyed by handle — scan by id.
      qc.getQueriesData({ queryKey: queryKeys.users.all }).forEach(
        ([key, data]) => {
          if (!data || typeof data !== "object") return;
          // useBlockedUsersQuery returns an array of user-shaped rows.
          if (Array.isArray(data)) {
            let touched = false;
            const next = data.map((u) => {
              if (u?.id === id) {
                touched = true;
                return { ...u, name, avatar, about };
              }
              return u;
            });
            if (touched) qc.setQueryData(key, next);
            return;
          }
          // usePublicProfileQuery shape: a user row at the top level.
          if (data.id === id) {
            qc.setQueryData(key, { ...data, name, avatar, about });
          }
        },
      );

      // 2) Chat list + detail + members. chats.all matches several
      //    shapes (Array<Entry>, { chats }, { chat, peers }, members
      //    array). Cover each defensively.
      qc.getQueriesData({ queryKey: queryKeys.chats.all }).forEach(
        ([key, data]) => {
          if (!data) return;

          // Chat list — array of entries with peers + lastMessage.sender.
          if (Array.isArray(data)) {
            let touched = false;
            const next = data.map((entry) => {
              if (!entry || typeof entry !== "object") return entry;
              // Members array shape (group members sheet): [{ id, role, user }]
              if (entry.user?.id === id) {
                touched = true;
                return { ...entry, user: patchUser(entry.user) };
              }
              // Chat-list entry shape: { chat, peers, lastMessage }
              if (entry.peers || entry.lastMessage) {
                const peers = (entry.peers ?? []).map(patchUser);
                const peersTouched = peers.some(
                  (p, i) => p !== entry.peers?.[i],
                );
                const lastMessage = entry.lastMessage?.sender?.id === id
                  ? {
                      ...entry.lastMessage,
                      sender: patchUser(entry.lastMessage.sender),
                    }
                  : entry.lastMessage;
                if (peersTouched || lastMessage !== entry.lastMessage) {
                  touched = true;
                  return { ...entry, peers, lastMessage };
                }
              }
              return entry;
            });
            if (touched) qc.setQueryData(key, next);
            return;
          }

          // Archived list shape: { chats: [...], count }
          if (Array.isArray(data.chats)) {
            let touched = false;
            const chats = data.chats.map((entry) => {
              if (!entry?.peers) return entry;
              const peers = entry.peers.map(patchUser);
              if (peers.some((p, i) => p !== entry.peers[i])) {
                touched = true;
                return { ...entry, peers };
              }
              return entry;
            });
            if (touched) qc.setQueryData(key, { ...data, chats });
            return;
          }

          // Chat detail shape: { chat, peers, membership }
          if (data.peers) {
            const peers = data.peers.map(patchUser);
            if (peers.some((p, i) => p !== data.peers[i])) {
              qc.setQueryData(key, { ...data, peers });
            }
          }
        },
      );

      // 3) Messages cache — every message.sender match.
      qc.getQueriesData({ queryKey: queryKeys.messages.all }).forEach(
        ([key, data]) => {
          if (!data?.pages) return;
          let touched = false;
          const pages = data.pages.map((page) => {
            const messages = page.messages.map((m) => {
              if (m.sender?.id !== id) return m;
              touched = true;
              return { ...m, sender: patchUser(m.sender) };
            });
            return touched ? { ...page, messages } : page;
          });
          if (touched) qc.setQueryData(key, { ...data, pages });
        },
      );

      // 4) Channel posts + replies — author field.
      qc.getQueriesData({ queryKey: queryKeys.channels.all }).forEach(
        ([key, data]) => {
          if (!data) return;
          // posts infinite query
          if (data.pages) {
            let touched = false;
            const pages = data.pages.map((page) => {
              if (!Array.isArray(page.posts)) return page;
              const posts = page.posts.map((p) => {
                if (p.author?.id !== id) return p;
                touched = true;
                return { ...p, author: patchUser(p.author) };
              });
              return touched ? { ...page, posts } : page;
            });
            if (touched) qc.setQueryData(key, { ...data, pages });
            return;
          }
          // replies array
          if (Array.isArray(data)) {
            let touched = false;
            const next = data.map((r) => {
              if (r?.author?.id !== id) return r;
              touched = true;
              return { ...r, author: patchUser(r.author) };
            });
            if (touched) qc.setQueryData(key, next);
          }
        },
      );
    };

    socket.on(SOCKET_EVENT.USER_PROFILE_UPDATED, onUpdate);
    return () => {
      socket.off(SOCKET_EVENT.USER_PROFILE_UPDATED, onUpdate);
    };
  }, [socket, qc]);
}
