@AGENTS.md

# CLAUDE.md — WhatsApp Web Clone (Next.js Full-Stack)

This file is the single source of truth for how Claude Code should build, extend, and maintain this project. Read it fully before writing any code.

---

## Project overview

A full-stack WhatsApp Web clone built entirely inside a single Next.js 14 App Router monorepo. The frontend uses React with TanStack Query, Axios, shadcn/ui, and Tailwind CSS. The backend uses Next.js Route Handlers (REST API) plus a custom Node.js server that attaches Socket.io for real-time features. The database is PostgreSQL accessed via Prisma.

---

## Absolute rules — never break these

- **Every file must stay under 300 lines.** If a file approaches the limit, split it: extract a subcomponent, a custom hook, or a helper utility before finishing.
- **All new files use kebab-case** — `message-bubble.jsx`, `use-socket.js`, `chat-store.js`. No camelCase or PascalCase filenames.
- **Never inline URL strings.** All API paths come from `src/config/endpoints.js`.
- **Never inline TanStack query key strings.** All keys come from `src/config/query-keys.js`.
- **Never call `useQuery` or `useMutation` directly inside a component.** All TanStack logic lives in `src/tanstack/<feature>/queries.js` or `mutations.js` and is exported as named hooks.
- **Never put business logic in a Route Handler file.** Route handlers only validate input, call a `lib/` function, and return a response.
- **Never import Prisma, JWT, or any Node-only module in a client component.** Use `'use client'` at the top of every component that uses hooks or browser APIs.
- **Every mutation must implement optimistic updates** using `onMutate` + `onError` rollback via `useQueryClient`.
- **`src/app/` only contains Next.js routing primitives** — `page.jsx`, `layout.jsx`, `route.js`, `loading.jsx`, `error.jsx`, `not-found.jsx`, `globals.css`. Providers, components, hooks, stores, and any reusable logic live in their dedicated top-level folders (`src/providers/`, `src/features/`, `src/hooks/`, `src/stores/`, `src/lib/`, `src/utils/`, `src/models/`).
- **Each page gets its own subfolder under `src/features/<feature>/<page>/`** — e.g. `features/auth/login/login-form.jsx` + `features/auth/login/schema.js`. Components that are shared across pages of a feature go in `features/<feature>/shared/`. Forms use **react-hook-form + zod**; the schema lives in `schema.js` inside the page folder.

---

## Stack

| Layer          | Technology                             |
| -------------- | -------------------------------------- |
| Framework      | Next.js latest(App Router)             |
| UI components  | shadcn/ui + Tailwind CSS               |
| Icons          | lucide-react                           |
| Server state   | TanStack Query v5                      |
| HTTP client    | Axios (shared instance)                |
| Client state   | Zustand                                |
| Real-time      | Socket.io (custom server)              |
| ORM            | Prisma                                 |
| Database       | PostgreSQL                             |
| Auth           | Jose (JWT, edge-compatible) + bcryptjs |
| Media uploads  | Cloudinary (or S3)                     |
| Virtualization | TanStack Virtual                       |
| Dates          | date-fns                               |

---

## Folder structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.jsx
│   │   └── register/page.jsx
│   ├── (main)/
│   │   ├── layout.jsx          # Shell with left nav rail + 2-column split
│   │   ├── chat/page.jsx       # Empty state ("Download WhatsApp for Windows")
│   │   ├── chat/[id]/page.jsx
│   │   ├── status/page.jsx
│   │   ├── communities/page.jsx
│   │   ├── channels/page.jsx
│   │   ├── calls/page.jsx
│   │   ├── archived/page.jsx
│   │   ├── starred/page.jsx
│   │   └── settings/
│   │       ├── page.jsx        # Settings index (Profile/Account/Privacy/Chats/Notifications/Keyboard/Help)
│   │       ├── profile/page.jsx
│   │       ├── account/page.jsx
│   │       ├── privacy/page.jsx
│   │       ├── chats/page.jsx
│   │       ├── notifications/page.jsx
│   │       └── help/page.jsx
│   ├── api/                    # Route Handlers (backend)
│   │   ├── auth/
│   │   │   ├── login/route.js
│   │   │   ├── register/route.js
│   │   │   ├── logout/route.js
│   │   │   └── refresh/route.js
│   │   ├── chats/
│   │   │   ├── route.js
│   │   │   ├── [id]/route.js
│   │   │   ├── [id]/messages/route.js
│   │   │   ├── [id]/members/route.js
│   │   │   ├── [id]/pin/route.js
│   │   │   ├── [id]/mute/route.js
│   │   │   ├── [id]/archive/route.js
│   │   │   ├── [id]/favourite/route.js
│   │   │   └── [id]/labels/route.js
│   │   ├── messages/
│   │   │   ├── [id]/route.js
│   │   │   ├── [id]/react/route.js
│   │   │   ├── [id]/star/route.js
│   │   │   └── upload/route.js
│   │   ├── users/
│   │   │   ├── route.js
│   │   │   ├── me/route.js
│   │   │   ├── me/avatar/route.js
│   │   │   ├── me/about/route.js
│   │   │   ├── me/privacy/route.js
│   │   │   └── [id]/block/route.js
│   │   ├── status/
│   │   │   ├── route.js
│   │   │   └── [id]/view/route.js
│   │   ├── communities/
│   │   │   ├── route.js
│   │   │   └── [id]/route.js
│   │   ├── channels/
│   │   │   ├── route.js
│   │   │   └── [id]/route.js
│   │   └── calls/
│   │       ├── route.js
│   │       └── [id]/route.js
│   ├── layout.jsx
│   └── globals.css
│
├── features/                   # UI components, grouped by feature
│   ├── auth/                       # One subfolder per page; `shared/` for cross-page bits
│   │   ├── login/
│   │   │   ├── login-form.jsx
│   │   │   └── schema.js
│   │   ├── register/
│   │   │   ├── register-form.jsx
│   │   │   └── schema.js
│   │   └── shared/
│   │       └── auth-guard.jsx
│   ├── layout/
│   │   ├── nav-rail.jsx        # Left vertical icon rail (Chats/Status/Channels/Communities/Settings/Avatar)
│   │   ├── nav-rail-item.jsx
│   │   ├── split-pane.jsx      # Left list pane + right detail pane (2-column shell)
│   │   └── empty-detail-pane.jsx # "Download WhatsApp for Windows" placeholder
│   ├── chat/
│   │   ├── chat-list.jsx
│   │   ├── chat-list-item.jsx  # Avatar, name, last msg, time, unread badge, mute icon, receipt ticks
│   │   ├── chat-list-header.jsx # "WhatsApp" title + new-chat (+) + overflow menu (⋮)
│   │   ├── chat-search.jsx     # "Search or start a new chat"
│   │   ├── chat-filter-tabs.jsx # All / Unread / Favourites / Groups + overflow chevron
│   │   ├── chat-header.jsx     # Contact name, online/typing, search + overflow
│   │   ├── chat-window.jsx
│   │   ├── chat-wallpaper.jsx  # Doodle background for the message pane
│   │   ├── new-chat-modal.jsx
│   │   └── new-group-modal.jsx
│   ├── messages/
│   │   ├── message-bubble.jsx      # Outgoing (green tint) vs incoming, tail, time + ticks
│   │   ├── message-input.jsx       # + attach, emoji, text, mic
│   │   ├── message-list.jsx        # Virtualized, day separators ("Yesterday", "Today")
│   │   ├── message-reactions.jsx
│   │   ├── message-reply-preview.jsx
│   │   ├── message-context-menu.jsx
│   │   ├── message-forward-arrow.jsx
│   │   ├── voice-recorder.jsx
│   │   └── media-preview.jsx
│   ├── users/
│   │   ├── contact-list.jsx
│   │   ├── user-avatar.jsx         # Circular, fallback initials, online dot
│   │   ├── user-profile-drawer.jsx
│   │   └── online-indicator.jsx
│   ├── status/
│   │   ├── status-list.jsx         # "My status" row + Recent + Viewed sections
│   │   ├── status-list-item.jsx    # Ring around avatar (unwatched green / watched grey)
│   │   ├── status-viewer.jsx       # Top progress segments, reply input bar
│   │   ├── status-empty-pane.jsx   # Right pane: "Text status" + "Photo and video" actions
│   │   └── status-composer.jsx
│   ├── communities/
│   │   ├── community-list.jsx
│   │   ├── community-item.jsx
│   │   └── community-media-browser.jsx # Tabs: Media / Docs / Links
│   ├── channels/
│   │   ├── channel-list.jsx
│   │   └── channel-item.jsx
│   ├── calls/
│   │   ├── call-screen.jsx
│   │   ├── call-log-item.jsx
│   │   └── incoming-call-modal.jsx
│   ├── settings/
│   │   ├── settings-list.jsx       # Sidebar list of settings sections
│   │   ├── settings-section.jsx    # Right pane section wrapper
│   │   ├── profile-editor.jsx      # Avatar + Edit, About, Name, Phone (read-only)
│   │   ├── account-settings.jsx
│   │   ├── privacy-settings.jsx    # Last seen, Profile pic, About, Status, Read receipts, etc.
│   │   ├── chat-settings.jsx       # Theme, Wallpaper, Media upload quality, Spell check, etc.
│   │   ├── notification-settings.jsx
│   │   └── keyboard-shortcuts-dialog.jsx
│   └── notifications/
│       ├── notification-item.jsx
│       └── notification-bell.jsx
│
├── tanstack/                   # TanStack Query hooks, per feature
│   ├── auth/
│   │   ├── queries.js
│   │   └── mutations.js
│   ├── chat/
│   │   ├── queries.js
│   │   └── mutations.js
│   ├── messages/
│   │   ├── queries.js
│   │   └── mutations.js
│   ├── users/
│   │   ├── queries.js
│   │   └── mutations.js
│   ├── status/
│   │   ├── queries.js
│   │   └── mutations.js
│   └── calls/
│       ├── queries.js
│       └── mutations.js
│
├── components/
│   └── ui/                     # shadcn/ui components (auto-generated, do not edit)
│
├── hooks/                      # Shared custom hooks
│   ├── use-socket.js
│   ├── use-auth.js
│   ├── use-online-status.js
│   ├── use-typing-indicator.js
│   └── use-media-upload.js
│
├── stores/                     # Zustand stores
│   ├── auth-store.js
│   ├── chat-store.js
│   ├── socket-store.js
│   └── ui-store.js
│
├── providers/                  # Client-side React context providers
│   ├── app-providers.jsx       # Composes every provider; wrapped around <body>
│   └── query-provider.jsx      # TanStack Query client
│
├── models/                     # JSDoc typedefs + enum constants (TS-style intellisense)
│   ├── index.js                # Re-exports every model
│   ├── enums.js                # MessageType, MemberRole, ReceiptStatus, …
│   ├── user.js                 # User, PrivacySettings, ChatPreferences, Block
│   ├── chat.js                 # Chat, ChatMember, Label, ChatListEntry
│   ├── message.js              # Message, MessageReceipt, Reaction, MessagePage
│   ├── status.js               # Status, StatusView
│   ├── community.js            # Community, CommunityMember
│   ├── channel.js              # Channel, ChannelSubscriber
│   └── call.js                 # Call, CallParticipant
│
├── config/                     # Single source of truth for keys and URLs
│   ├── query-keys.js
│   ├── endpoints.js
│   └── axios-instance.js
│
├── lib/                        # Server-only utilities (never imported in client components)
│   ├── prisma.js
│   ├── auth.js
│   ├── socket-server.js
│   └── upload.js
│
└── utils/                      # Pure functions, safe on client and server
    ├── date-format.js
    ├── message-format.js
    └── validators.js

prisma/
└── schema.prisma

server.js                       # Custom Node.js server (Socket.io + Next.js)
```

---

## Config files

### `src/config/query-keys.js`

The single source of truth for all TanStack Query cache keys. Always use dot notation — `queryKeys.messages.list(chatId)` — never write a raw array in a query hook.

```js
export const queryKeys = {
  auth: {
    me: ["auth", "me"],
    session: ["auth", "session"],
  },
  chats: {
    all: ["chats"],
    list: (filters) => ["chats", "list", filters], // filters: { tab, labelId, search }
    detail: (id) => ["chats", "detail", id],
    members: (id) => ["chats", "members", id],
    media: (id) => ["chats", "media", id],
  },
  messages: {
    all: ["messages"],
    list: (chatId) => ["messages", "list", chatId],
    starred: ["messages", "starred"],
  },
  users: {
    all: ["users"],
    detail: (id) => ["users", "detail", id],
    search: (q) => ["users", "search", q],
    contacts: ["users", "contacts"],
    privacy: ["users", "me", "privacy"],
    chatPrefs: ["users", "me", "chat-prefs"],
  },
  status: {
    all: ["status"],
    mine: ["status", "mine"],
    contacts: ["status", "contacts"],
    viewers: (id) => ["status", "viewers", id],
  },
  communities: {
    list: ["communities"],
    detail: (id) => ["communities", "detail", id],
  },
  channels: {
    list: ["channels"],
    detail: (id) => ["channels", "detail", id],
  },
  labels: {
    list: ["labels"],
  },
  calls: {
    log: ["calls", "log"],
    active: ["calls", "active"],
  },
};
```

### `src/config/endpoints.js`

The single source of truth for all API URLs. Route handlers and TanStack hooks both import from here — never write a URL string anywhere else.

```js
const BASE = "/api";

export const endpoints = {
  auth: {
    login: `${BASE}/auth/login`,
    register: `${BASE}/auth/register`,
    logout: `${BASE}/auth/logout`,
    refresh: `${BASE}/auth/refresh`,
    me: `${BASE}/users/me`,
  },
  chats: {
    list: `${BASE}/chats`,
    detail: (id) => `${BASE}/chats/${id}`,
    messages: (id) => `${BASE}/chats/${id}/messages`,
    members: (id) => `${BASE}/chats/${id}/members`,
    pin: (id) => `${BASE}/chats/${id}/pin`,
    mute: (id) => `${BASE}/chats/${id}/mute`,
    archive: (id) => `${BASE}/chats/${id}/archive`,
    favourite: (id) => `${BASE}/chats/${id}/favourite`,
    labels: (id) => `${BASE}/chats/${id}/labels`,
    media: (id) => `${BASE}/chats/${id}/media`,
  },
  messages: {
    detail: (id) => `${BASE}/messages/${id}`,
    react: (id) => `${BASE}/messages/${id}/react`,
    star: (id) => `${BASE}/messages/${id}/star`,
    upload: `${BASE}/messages/upload`,
  },
  users: {
    list: `${BASE}/users`,
    me: `${BASE}/users/me`,
    avatar: `${BASE}/users/me/avatar`,
    about: `${BASE}/users/me/about`,
    privacy: `${BASE}/users/me/privacy`,
    chatPrefs: `${BASE}/users/me/chat-prefs`,
    block: (id) => `${BASE}/users/${id}/block`,
  },
  status: {
    list: `${BASE}/status`,
    view: (id) => `${BASE}/status/${id}/view`,
  },
  communities: {
    list: `${BASE}/communities`,
    detail: (id) => `${BASE}/communities/${id}`,
  },
  channels: {
    list: `${BASE}/channels`,
    detail: (id) => `${BASE}/channels/${id}`,
  },
  labels: {
    list: `${BASE}/labels`,
  },
  calls: {
    list: `${BASE}/calls`,
    detail: (id) => `${BASE}/calls/${id}`,
  },
};
```

### `src/config/axios-instance.js`

All API calls go through this instance. It injects the access token on every request and handles silent token refresh on 401.

```js
import axios from "axios";
import { endpoints } from "./endpoints";

const api = axios.create({ baseURL: "/", withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      await api.post(endpoints.auth.refresh);
      return api(err.config);
    }
    return Promise.reject(err);
  },
);

export default api;
```

---

## TanStack Query patterns

### queries.js pattern

```js
// src/tanstack/messages/queries.js
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { queryKeys } from "@/config/query-keys";
import { endpoints } from "@/config/endpoints";

export const useMessagesQuery = (chatId) =>
  useInfiniteQuery({
    queryKey: queryKeys.messages.list(chatId),
    queryFn: ({ pageParam = null }) =>
      api
        .get(endpoints.chats.messages(chatId), {
          params: { cursor: pageParam, limit: 40 },
        })
        .then((r) => r.data),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!chatId,
    staleTime: 1000 * 60,
  });
```

### mutations.js pattern

Every mutation must implement optimistic updates. Always cancel in-flight queries, snapshot previous data, apply optimistic change, and roll back on error.

```js
// src/tanstack/messages/mutations.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/config/axios-instance";
import { queryKeys } from "@/config/query-keys";
import { endpoints } from "@/config/endpoints";

export const useSendMessageMutation = (chatId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post(endpoints.chats.messages(chatId), payload).then((r) => r.data),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: queryKeys.messages.list(chatId) });
      const prev = qc.getQueryData(queryKeys.messages.list(chatId));
      qc.setQueryData(queryKeys.messages.list(chatId), (old) => ({
        ...old,
        pages:
          old?.pages?.map((p, i) =>
            i === 0
              ? {
                  ...p,
                  messages: [
                    { id: `temp-${Date.now()}`, ...payload },
                    ...p.messages,
                  ],
                }
              : p,
          ) ?? [],
      }));
      return { prev };
    },
    onError: (_, __, ctx) =>
      qc.setQueryData(queryKeys.messages.list(chatId), ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.messages.list(chatId) }),
  });
};
```

---

## API Route Handler pattern

Route handlers are thin. Validate → call lib → respond. No Prisma calls, no JWT logic, no business rules inside a `route.js` file.

```js
// src/app/api/chats/[id]/messages/route.js
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMessages, createMessage } from "@/lib/messages";

export async function GET(req, { params }) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const data = await getMessages({
    chatId: params.id,
    userId: user.id,
    cursor: searchParams.get("cursor"),
    limit: Number(searchParams.get("limit")) || 40,
  });
  return NextResponse.json(data);
}

export async function POST(req, { params }) {
  const user = await requireAuth(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const msg = await createMessage({
    ...body,
    chatId: params.id,
    senderId: user.id,
  });
  return NextResponse.json(msg, { status: 201 });
}
```

---

## Socket.io (custom server)

Next.js App Router does not support WebSocket upgrades natively. The project uses a custom Node.js entry point that wraps Next.js and attaches Socket.io to the same HTTP server.

```js
// server.js  (root of project — used instead of `next start`)
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { verifyToken } from "./src/lib/auth.js";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

await app.prepare();
const httpServer = createServer(handler);
const io = new Server(httpServer, {
  cors: { origin: process.env.NEXT_PUBLIC_URL, credentials: true },
});

io.use(async (socket, next) => {
  const user = await verifyToken(socket.handshake.auth.token);
  if (!user) return next(new Error("Unauthorized"));
  socket.userId = user.id;
  next();
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);

  socket.on("chat:join", (chatId) => socket.join(`chat:${chatId}`));
  socket.on("chat:leave", (chatId) => socket.leave(`chat:${chatId}`));

  socket.on("message:send", (data) =>
    io.to(`chat:${data.chatId}`).emit("message:new", data),
  );

  socket.on("message:read", (data) =>
    io.to(`chat:${data.chatId}`).emit("message:read", data),
  );

  socket.on("typing:start", (data) =>
    socket
      .to(`chat:${data.chatId}`)
      .emit("typing:update", { ...data, typing: true }),
  );

  socket.on("typing:stop", (data) =>
    socket
      .to(`chat:${data.chatId}`)
      .emit("typing:update", { ...data, typing: false }),
  );

  socket.on("disconnect", () =>
    io.emit("user:offline", { userId: socket.userId, lastSeen: new Date() }),
  );
});

httpServer.listen(process.env.PORT || 3000);
```

The `package.json` start script must point to this file:

```json
"scripts": {
  "dev": "node server.js",
  "start": "NODE_ENV=production node server.js",
  "build": "next build"
}
```

---

## Prisma schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String       @id @default(cuid())
  phone        String?      @unique
  email        String?      @unique
  passwordHash String
  name         String
  avatar       String?
  about        String?       @default("Hey there! I am using WhatsApp.")
  lastSeen     DateTime?
  isOnline     Boolean       @default(false)
  pushSubscription Json?     // Web Push subscription payload
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  chats        ChatMember[]
  messages     Message[]
  statuses     Status[]
  statusViews  StatusView[]
  reactions    Reaction[]
  receipts     MessageReceipt[]
  starredMsgs  StarredMessage[]
  blockedBy    Block[]       @relation("BlockedUser")
  blocking     Block[]       @relation("BlockingUser")
  calls        CallParticipant[]
  privacy      PrivacySettings?
  chatPrefs    ChatPreferences?
  labels       Label[]
  communityMemberships CommunityMember[]
  channelSubs  ChannelSubscriber[]
}

// Per-user privacy controls (Settings → Privacy screen)
model PrivacySettings {
  id                    String   @id @default(cuid())
  userId                String   @unique
  lastSeen              VisibilityScope @default(CONTACTS)
  profilePhoto          VisibilityScope @default(NOBODY)
  about                 VisibilityScope @default(CONTACTS)
  status                VisibilityScope @default(CONTACTS)
  readReceipts          Boolean  @default(true)
  groupsPolicy          VisibilityScope @default(EVERYONE)
  defaultDisappearing   Int?     // seconds; null = off
  blockUnknownMessages  Boolean  @default(false)
  linkPreviews          Boolean  @default(true)
  appLockEnabled        Boolean  @default(false)
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Per-user chat appearance + behaviour (Settings → Chats)
model ChatPreferences {
  id              String   @id @default(cuid())
  userId          String   @unique
  theme           Theme    @default(SYSTEM)
  wallpaperUrl    String?
  mediaUploadQuality MediaQuality @default(STANDARD)
  autoDownloadPhotos   Boolean @default(true)
  autoDownloadVideos   Boolean @default(false)
  autoDownloadDocs     Boolean @default(false)
  spellCheck      Boolean  @default(true)
  replaceTextWithEmoji Boolean @default(true)
  enterIsSend     Boolean  @default(true)
  showPreviews    Boolean  @default(true)
  outgoingSounds  Boolean  @default(false)
  backgroundSync  Boolean  @default(true)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Chat {
  id              String   @id @default(cuid())
  isGroup         Boolean  @default(false)
  name            String?  // group/community name; null for 1:1
  photo           String?
  description     String?
  communityId     String?  // optional grouping under a community
  pinnedMessageId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  community       Community? @relation(fields: [communityId], references: [id], onDelete: SetNull)
  members         ChatMember[]
  messages        Message[]
}

// Per-(chat,user) flags drive the chat-list sort + filters
// (pinned, favourite, archived, muted, label assignment)
model ChatMember {
  id          String     @id @default(cuid())
  chatId      String
  userId      String
  role        MemberRole @default(MEMBER)
  joinedAt    DateTime   @default(now())
  isPinned    Boolean    @default(false)
  isFavourite Boolean    @default(false)
  isArchived  Boolean    @default(false)
  mutedUntil  DateTime?  // null = not muted; future date = muted
  unreadCount Int        @default(0)
  lastReadAt  DateTime?

  chat   Chat   @relation(fields: [chatId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  labels ChatMemberLabel[]

  @@unique([chatId, userId])
  @@index([userId, isArchived, isPinned])
}

// User-defined chat labels (rendered as colored tags / filters)
model Label {
  id        String   @id @default(cuid())
  userId    String
  name      String
  color     String   @default("#25D366")
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  members   ChatMemberLabel[]

  @@unique([userId, name])
}

model ChatMemberLabel {
  chatMemberId String
  labelId      String
  chatMember   ChatMember @relation(fields: [chatMemberId], references: [id], onDelete: Cascade)
  label        Label      @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([chatMemberId, labelId])
}

model Message {
  id             String      @id @default(cuid())
  chatId         String
  senderId       String
  content        String?
  type           MessageType @default(TEXT)
  mediaUrl       String?
  mediaMime      String?
  mediaThumbUrl  String?     // generated preview for IMAGE/VIDEO/DOCUMENT cards
  mediaSizeBytes Int?
  mediaDuration  Int?        // seconds — for audio/video/voice notes
  fileName       String?     // original document filename
  caption        String?     // text shown under image/video/doc
  replyToId      String?
  forwardedFrom  String?
  forwardCount   Int         @default(0)
  expiresAt      DateTime?   // disappearing messages
  editedAt       DateTime?
  deletedAt      DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  chat       Chat             @relation(fields: [chatId], references: [id], onDelete: Cascade)
  sender     User             @relation(fields: [senderId], references: [id])
  replyTo    Message?         @relation("MessageReply", fields: [replyToId], references: [id], onDelete: SetNull)
  replies    Message[]        @relation("MessageReply")
  reactions  Reaction[]
  receipts   MessageReceipt[]
  starredBy  StarredMessage[]

  @@index([chatId, createdAt])
}

// One row per (message, recipient) — drives the tick-mark state per viewer
model MessageReceipt {
  id         String        @id @default(cuid())
  messageId  String
  userId     String
  status     ReceiptStatus @default(SENT)
  deliveredAt DateTime?
  seenAt     DateTime?
  message    Message       @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user       User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId])
}

// "Starred messages" view — per-user, so two users can independently star
model StarredMessage {
  id        String   @id @default(cuid())
  userId    String
  messageId String
  starredAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@unique([userId, messageId])
}

model Reaction {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  emoji     String
  createdAt DateTime @default(now())
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId])
}

model Status {
  id            String     @id @default(cuid())
  userId        String
  content       String?    // text content for TEXT type
  bgColor       String?    // background for TEXT statuses
  font          String?    // font choice for TEXT statuses
  mediaUrl      String?
  mediaMime     String?
  mediaDuration Int?       // seconds; for VIDEO
  caption       String?
  type          StatusType @default(TEXT)
  expiresAt     DateTime   // createdAt + 24h
  createdAt     DateTime   @default(now())
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  views         StatusView[]

  @@index([userId, createdAt])
  @@index([expiresAt])
}

model StatusView {
  id       String   @id @default(cuid())
  statusId String
  userId   String
  viewedAt DateTime @default(now())
  status   Status   @relation(fields: [statusId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([statusId, userId])
}

// Communities — group-of-groups, surfaces in the Communities nav rail tab
model Community {
  id          String   @id @default(cuid())
  name        String
  photo       String?
  description String?
  createdAt   DateTime @default(now())
  chats       Chat[]   // member groups (the announcement group is conventionally the first one)
  members     CommunityMember[]
}

model CommunityMember {
  id          String   @id @default(cuid())
  communityId String
  userId      String
  role        MemberRole @default(MEMBER)
  joinedAt    DateTime @default(now())
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([communityId, userId])
}

// Channels — broadcast-only one-to-many follow feed
model Channel {
  id          String   @id @default(cuid())
  name        String
  handle      String   @unique
  photo       String?
  description String?
  createdAt   DateTime @default(now())
  subscribers ChannelSubscriber[]
}

model ChannelSubscriber {
  id          String   @id @default(cuid())
  channelId   String
  userId      String
  mutedUntil  DateTime?
  joinedAt    DateTime @default(now())
  channel     Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([channelId, userId])
}

model Block {
  id          String   @id @default(cuid())
  blockerId   String
  blockedId   String
  createdAt   DateTime @default(now())
  blocker     User     @relation("BlockingUser", fields: [blockerId], references: [id])
  blocked     User     @relation("BlockedUser",  fields: [blockedId],  references: [id])

  @@unique([blockerId, blockedId])
}

model Call {
  id          String   @id @default(cuid())
  type        CallType @default(VOICE)
  status      CallStatus @default(MISSED)
  startedAt   DateTime?
  endedAt     DateTime?
  createdAt   DateTime @default(now())
  participants CallParticipant[]
}

model CallParticipant {
  id     String @id @default(cuid())
  callId String
  userId String
  call   Call   @relation(fields: [callId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id])
}

enum MessageType    { TEXT IMAGE VIDEO AUDIO DOCUMENT LOCATION VOICE_NOTE STICKER CONTACT POLL SYSTEM }
enum MemberRole     { OWNER ADMIN MEMBER }
enum ReceiptStatus  { SENT DELIVERED READ }
enum StatusType     { TEXT IMAGE VIDEO }
enum CallType       { VOICE VIDEO }
enum CallStatus     { MISSED ANSWERED DECLINED ONGOING }
enum VisibilityScope { EVERYONE CONTACTS CONTACTS_EXCEPT NOBODY }
enum Theme          { LIGHT DARK SYSTEM }
enum MediaQuality   { STANDARD HD }
```

---

## Environment variables

```env
# .env.local
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
NEXT_PUBLIC_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

---

## Page structure rule

Every page file must be thin — it only composes layouts and feature components. No data fetching, no hooks beyond route params, no inline JSX logic.

```jsx
// src/app/(main)/chat/[id]/page.jsx
"use client";
import { ChatHeader } from "@/features/chat/chat-header";
import { MessageList } from "@/features/messages/message-list";
import { MessageInput } from "@/features/messages/message-input";

export default function ChatPage({ params }) {
  return (
    <div className="flex flex-col h-full">
      <ChatHeader chatId={params.id} />
      <MessageList chatId={params.id} />
      <MessageInput chatId={params.id} />
    </div>
  );
}
```

---

## Feature implementation checklist

When adding any new feature, complete all layers in order:

1. Add the Prisma model or field if needed → run `prisma migrate dev`
2. Add the `lib/` function (server logic, Prisma query)
3. Add the Route Handler in `app/api/`
4. Add the endpoint to `config/endpoints.js`
5. Add the query key to `config/query-keys.js`
6. Write `tanstack/<feature>/queries.js` and/or `mutations.js`
7. Build the feature component(s) in `features/<feature>/`
8. Wire into the page view

---

## UI / UX specification

The reference UI is WhatsApp Web in dark mode. Match this layout exactly — colours, spacing, and component anatomy.

### Global shell

A persistent two-column layout sits inside `(main)/layout.jsx`:

1. **Nav rail** — fixed 64px-wide vertical bar pinned to the far left of the viewport. Vertically stacked icon buttons in this order from top:
   - Chats (speech-bubble icon) — small green dot in the corner when there are unread chats
   - Status (concentric ring icon)
   - Channels (broadcast icon)
   - Communities (group-of-people icon)
   - Meta AI (gradient flower icon) — separator above it
   - Spacer (flex-grow)
   - Saved / Archived (folder icon)
   - User avatar (clickable → opens profile drawer)
   Active item gets a subtle filled background. Tooltip on hover.
2. **List pane** — fixed-width column (~420px) to the right of the nav rail. Holds the contextual list (chat list, status list, settings sections, etc.).
3. **Detail pane** — flex-1, fills the remaining viewport. Empty state shows the "Download WhatsApp for Windows" promo card centered, plus a row of three pill buttons at the bottom (Send document / Add contact / Ask Meta AI) and an "Activate Windows" watermark in the bottom-right corner only on Windows.

### Colour tokens (dark theme is default)

| Token              | Value     | Used for                                  |
| ------------------ | --------- | ----------------------------------------- |
| `--wa-bg`          | `#0B141A` | App background (detail pane, body)        |
| `--wa-panel`       | `#111B21` | List pane background, modals              |
| `--wa-panel-2`     | `#202C33` | Headers, search input, hover surfaces     |
| `--wa-panel-3`     | `#2A3942` | Active item, incoming message bubble      |
| `--wa-border`      | `#222D34` | Dividers between rows                     |
| `--wa-text`        | `#E9EDEF` | Primary text                              |
| `--wa-text-muted`  | `#8696A0` | Secondary text, timestamps, placeholders  |
| `--wa-green`       | `#00A884` | Brand green — links, ticks, active states |
| `--wa-green-2`     | `#005C4B` | Outgoing message bubble                   |
| `--wa-green-soft`  | `#103529` | Selected/pinned chip background           |
| `--wa-read-blue`   | `#53BDEB` | Double-tick "read" colour                 |
| `--wa-danger`      | `#F15C6D` | Destructive actions (Log out)             |

Light theme mirrors the same semantic tokens; users switch via Settings → Chats → Theme. Default to `system` preference using a `data-theme` attribute on `<html>`.

### Chat list pane

Top to bottom:

- **Header** — title "WhatsApp" (24px, bold), right-aligned icon group: new chat (`+`) + overflow `⋮` (opens menu: New group / New community / Starred messages / Select chats / Log out).
- **Search row** — full-width pill input with magnifying-glass icon, placeholder "Search or start a new chat".
- **Filter chip row** — horizontally scrollable chips: `All` (selected → green text on dark-green pill), `Unread`, `Favourites`, `Groups`, then a chevron-down chip that opens the rest (labels).
- **Chat rows** — `<ChatListItem>`:
  - Left: 49px avatar with optional online dot.
  - Middle: contact/group name (top, 16px), last-message preview (bottom, 14px muted). Preview is prefixed with a double-tick (grey/blue) when the last message is outgoing, and includes media-type icons (camera, mic, document) when applicable.
  - Right: timestamp (12px muted; turns green when unread), unread count badge (green pill, white text), mute icon (bell with slash) below the time when muted, pin icon when pinned.
  - Selected row: `--wa-panel-3` background.
- **Sections** — pinned chats render first (with a small pin icon next to the time), then archived collapsed group, then recent.

### Chat (message) pane

- **Header** — 60px tall, `--wa-panel-2` background. Left: avatar + name + presence line ("online" / "typing…" / last seen). Right: video-call, voice-call, search, overflow `⋮`.
- **Body** — `--wa-bg` with a faint repeating doodle SVG overlay at ~6% opacity. Day separators (`Today`, `Yesterday`, date) appear as a centered grey pill.
- **Message bubble** — max-width 65%, 7.5px border radius, 8px padding. First-of-group includes a tail. Outgoing right-aligned `--wa-green-2`; incoming left-aligned `--wa-panel-3`. Time + tick row sits inline at the bottom-right of the bubble. Media (image/video/doc) renders edge-to-edge with caption beneath.
- **Reactions** — small floating pill below the bubble, max 3 emojis + counter.
- **Forwarded indicator** — italic "Forwarded" with a double-arrow icon above the bubble content.
- **Input** — `--wa-panel-2` bar at the bottom: `+` attach menu (Document / Photos & videos / Camera / Contact / Poll), emoji button, text input (`Type a message`), mic button when empty, send button when text is present.

### Status pane

- **Header** — title "Status", new-status (`+`) and overflow.
- **My status row** — your avatar with a `+` badge, "My status" / "Click to add status update".
- **Recent** section — entries from the last 24h that you haven't viewed yet. Avatar has a 2px green ring split into segments (one segment per status). Subtitle = relative time ("Today at 16:57").
- **Viewed** section — already-viewed statuses. Ring turns grey.
- **Detail pane (empty)** — two big centered round icon buttons: pencil ("Text status") and camera ("Photo and video").
- **Status viewer** — full detail pane, black background. Top: segment progress bars (one per status the user has, current one animates). Below: avatar + name + "Today at HH:mm" + audio toggle + overflow. Center: media or text status. Bottom: "Type a reply…" pill input with emoji/sticker buttons and a send arrow. Side arrows (`<` `>`) for previous/next user.

### Communities pane

- **Header** — "Communities" + `+` add.
- **List** — each community is a card: large rounded square photo, name, "View all" link, then a nested list of its sub-groups (rounded square photo, group name, last message preview).
- **Detail pane** — when a community is open, includes a media browser modal with tabs **Media / Docs / Links**, plus search, sort, and bulk-select icons. Media tab shows a 5-column grid of thumbnails grouped by date headers ("Yesterday — 24 June 2026"). Footer text: "Your personal messages in communities are end-to-end encrypted".

### Settings

- **Sidebar list** (in the list pane) — header "Settings", search input, sections: Profile, Account, Privacy, Chats, Notifications, Keyboard shortcuts, Help and feedback, then a red "Log out" entry at the bottom. Notification banner card "Choose your notifications" can appear at the top.
- **Detail pane** — renders the selected section. Each subpage has a back-arrow + title header.
  - **Profile** — large centered avatar with "Edit" pill below, then About (with edit pencil), Name (with edit pencil), Phone (with copy icon, read-only).
  - **Account** — list rows: Security notifications, Request account info, How to delete my account.
  - **Privacy** — groupings:
    - *Who can see my personal info*: Last seen and online (`My contacts`), Profile picture (`Nobody`), About (`My contacts`), Status (`N contacts excluded`).
    - Read receipts (toggle; caption "If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats").
    - *Disappearing messages*: Default message timer (`Off`).
    - Groups (`Everyone`), Blocked contacts (count), App lock ("Require password to unlock WhatsApp").
    - *Advanced*: Block unknown account messages (toggle + caption), Turn off link previews (toggle + caption).
  - **Chats** — *Display*: Theme (`System default`), Wallpaper. *Chat settings*: Media upload quality, Media auto-download, Spell check (toggle), Replace text with emoji (toggle), Enter is send (toggle).
  - **Notifications** — Messages (`On`), Groups (`On`), Status (`On`), Show previews (toggle), Play sound for outgoing messages (toggle), Background sync (toggle).
  - **Keyboard shortcuts** — modal dialog with a two-column grid of `Ctrl Alt Shift X` chips for: Mark as unread, Archive chat, Search, New chat, Previous chat, Close chat, Profile and About, Mute, Pin chat, Search chat, Next chat, Label chat, New group, Increase speed of selected voice message, etc. OK button bottom-right.

### Component primitives (built on shadcn/ui)

- `Avatar` — circular with fallback initials; supports `online`, `ring`, and `ringColor` props for status.
- `Tick` — single grey / double grey / double blue, controlled by `ReceiptStatus`.
- `Chip` — rounded full pill, default + selected (green) variants. Used for chat-list filters and keyboard-shortcut keys.
- `SectionDivider` — full-width 1px `--wa-border` with optional centered label.
- `ListRow` — 72px-tall row with avatar slot, primary/secondary text stack, and right-aligned metadata slot. Used in chat list, status list, contact list, settings list.

### Density & typography

- Base font: `Segoe UI`, `Helvetica Neue`, system-ui fallback.
- Sizes: title 24, section header 16 semibold, body 14.5, caption 12.
- Default radius: 7.5px (bubbles), 8px (cards), 24px (pill inputs/buttons).
- Standard transitions: 120ms ease for hover, 200ms ease for theme/route changes.

---

## Build phases

| Phase | Scope                                                                         |
| ----- | ----------------------------------------------------------------------------- |
| 1     | Scaffold, all config files, Prisma schema, query client provider, theme tokens, dark/light CSS variables |
| 2     | Auth — API routes, lib/auth.js, tanstack/auth/\*, login + register UI         |
| 3     | App shell — nav rail, split-pane layout, empty detail-pane, routing for (main) |
| 4     | Chat list — API, tanstack/chat/\*, list pane with search + filter chips (All/Unread/Favourites/Groups), pinned/archived/muted/favourite states |
| 5     | Messages — API, infinite query, send mutation, message-bubble UI with tails, day separators, doodle wallpaper |
| 6     | Real-time — server.js, use-socket.js, socket-store.js, typing + read receipts, online presence |
| 7     | Media — upload API, Cloudinary, voice recorder, media preview, image/video/doc bubbles, attach `+` menu |
| 8     | Groups + contacts — group creation, member management, user search, labels |
| 9     | Status / Stories — 24h TTL, list with rings, composer (text + media), viewer with segmented progress bars |
| 10    | Communities + Channels — community list, sub-group nesting, channel feed, media browser (Media/Docs/Links tabs) |
| 11    | Settings — Profile, Account, Privacy, Chats (theme/wallpaper), Notifications, Keyboard shortcuts dialog |
| 12    | Calls + notifications — WebRTC UI, call log, incoming-call modal, Web Push |
| 13    | Polish — TanStack Virtual list, PWA, keyboard shortcuts wired, light theme parity |

---

## Settings overhaul — full WhatsApp-Web parity (in progress)

Every Settings screen must be functional end-to-end, server-backed, and use cache-patching mutations so we never refetch the same row twice in a session. This block tracks the plan; tick phases as they land.

### Constraints (apply to every phase)

- **Cache strategy** — every Settings query uses `staleTime: Infinity`. Settings only change when the user changes them, and every mutation patches `queryClient.setQueryData(...)` in `onSuccess` instead of invalidating. Zero redundant GETs.
- **Debounce free-text fields** — Name and About save on blur or 600ms debounce, not per keystroke. Avatar upload is a single multipart POST on file pick.
- **Optimistic UI** — every toggle flips the UI instantly via `onMutate` + rollback on error. The user never waits for a round-trip to see a switch move.
- **No layout duplication** — every subpage reuses `SettingsSection` + `Row` primitives from `features/settings/shared/`. No bespoke padding/border CSS per screen.
- **All copy via `COPY.*`** — no inline strings. All routes via `endpoints.users.*` + `endpoints.settings.*`. All keys via `queryKeys.users.*`.

### Scope cuts (explicitly not built)

- *Request account info* — no data-export pipeline yet; row stays but shows a "coming soon" toast.
- *App lock* — needs WebAuthn / re-auth flow, separate feature. Toggle stays disabled with a "coming soon" caption.

### Phase S1 — Privacy "except" picker (the immediate ask)

The five Privacy rows (Last seen, Profile photo, About, Status, Groups) need a contact-multi-select modal when the user picks "My contacts except…" or "Only share with…".

1. Add `privacyExceptions` JSON column on `PrivacySettings` keyed by field:
   `{ lastSeen: [userId, …], profilePhoto: […], about: […], status: […], groups: […] }`.
2. `lib/privacy.js`:
   - `setPrivacyException({ userId, field, excludedIds })` — replaces the array for one field.
   - `getEligibleContacts(userId)` — returns the friends list (accepted-friend-request peers) as `{ id, name, avatar, about }`.
3. Route Handlers: `PATCH /api/users/me/privacy/exceptions` and `GET /api/users/me/contacts/eligible`.
4. UI: `privacy-exception-picker.jsx` — Sheet with search input, checkbox list, "N contacts excluded" footer pill, save button. Same picker used for all five Privacy "except" rows.
5. The Privacy row sublabels render the live count (e.g. *"281 contacts excluded"*).

### Phase S2 — Profile screen (Profile / Account)

- **Avatar** — `POST /api/users/me/avatar` (multipart). Upload to Cloudinary, store URL on `User.avatar`. Optimistic preview from `URL.createObjectURL` until the upload resolves.
- **Name** — `PATCH /api/users/me` debounced. Max 25 chars, zod-validated.
- **About** — `PATCH /api/users/me/about` debounced. Inline emoji picker preset (`Available`, `Busy`, `At work`, `Battery about to die`, …) like WhatsApp.
- **Phone** — read-only, copy-to-clipboard button.
- **Handle** — read-only display of `@handle`, copy button.
- **Security notifications** — toggle on `User.securityNotifications` (new column).
- **Delete my account** — confirm dialog with handle re-type, then `DELETE /api/users/me` cascades via Prisma + signs the user out.

### Phase S3 — Privacy switches + read receipts

Wire every remaining Privacy field on `PrivacySettings`:

- Visibility scopes (Last seen, Online, Profile photo, About, Status, Groups) — radio group + the S1 exception picker.
- `readReceipts` toggle.
- `defaultDisappearing` — modal with the 24h / 7d / 90d / Off options. Applies to *new* chats only.
- `blockUnknownMessages` toggle.
- `linkPreviews` toggle.
- **Blocked contacts** — full list pane reachable from the Privacy row. Reuses existing block API.
- **Online** sub-row — when Last seen is hidden, force Online to "Same as last seen" (mirrors WhatsApp).

### Phase S4 — Chat preferences

Wire every field on `ChatPreferences`:

- `theme` — Light / Dark / System. Apply by toggling `data-theme` on `<html>` and persisting via `useTheme`.
- `wallpaperUrl` — picker dialog with the WhatsApp doodle set + "Solid colors" tab + "Upload your own" via `/api/users/me/wallpaper`.
- `mediaUploadQuality` — Standard / HD. Reduces client-side image compression when set to Standard.
- Auto-download toggles (photos / audio / videos / docs).
- `spellCheck`, `replaceTextWithEmoji`, `enterIsSend` — all wired to the message-input component flags via a Zustand selector that reads from cached prefs.
- `showPreviews`, `outgoingSounds`, `backgroundSync` — same pattern.
- *Export chat* — per-chat row in chat-info that emits a `.txt` download via `/api/chats/[id]/export`.

### Phase S5 — Notifications

Backed by a new `NotificationPreferences` model:

```
messages       Boolean @default(true)
groups         Boolean @default(true)
status         Boolean @default(true)
showPreviews   Boolean @default(true)
reactionSounds Boolean @default(true)
outgoingSounds Boolean @default(false)
```

Toggles patch a single `/api/users/me/notifications` endpoint. The existing Web-Push subscription stays attached to `User.pushSubscription`. When *Messages* is off, `lib/push.js` skips notification sends for that recipient (server-side enforcement, not just UI).

### Phase S6 — Keyboard shortcuts dialog

Pure UI — a static modal listing every shortcut. The actual key handlers go in `useGlobalShortcuts()` hook mounted at the (main) layout:

- `Ctrl+Alt+Shift+U` mark unread, `…+E` archive, `…+/` search, `…+N` new chat, `…+↑/↓` prev/next chat, `…+P` profile, `…+Backspace` close chat, `…+M` mute, `…+Shift+P` pin, `…+F` search-in-chat, `…+L` label, `…+G` new group.

### Phase S7 — Optimization audit (LANDED — rules are now enforceable)

Settings is wired to the four cache contracts below. Future Settings work must hold the line.

1. **`staleTime: Infinity` on every settings query** — `useMeQuery`, `usePrivacyQuery`, `useChatPrefsQuery`, `useNotifPrefsQuery`, `useBlockedUsersQuery`, `useEligibleContactsQuery`. They only change on user action, and every mutation patches the cache directly. Search and public-profile queries are excluded — they're inherently fresh-data queries.
2. **Patch, never invalidate** — every Settings mutation follows: `onMutate` (optimistic patch) → `onError` (rollback) → `onSuccess: setQueryData(server)`. **No `onSettled: invalidate`** anywhere in the settings tree (block/unblock included). The server-returned canonical row replaces the cache on success — invalidating on top of that fires a wasteful GET per toggle.
3. **Settings list pre-warms the four caches** — opening `/settings` calls `usePrivacyQuery() / useChatPrefsQuery() / useNotifPrefsQuery()` so opening any subpage finds the data in cache. `useMeQuery` is already warm from `useAuth()`. No bundle endpoint — four parallel GETs once per session beats the maintenance cost of a `getUserSettings()` shim that would conflict with the per-mutation cache patches.
4. **Hot-path consumers use `select` projections** — anything that reads `useChatPrefsQuery()` from outside `/settings` (chat-wallpaper, media-preview, message-input, use-media-upload, use-theme-sync) passes a module-level selector. Wallpaper change must not re-render the composer; enterIsSend toggle must not re-render every bubble.
5. **Free-text inputs save on confirm, not per keystroke** — `InlineEditRow` saves on the explicit Save button (not while typing). Search-style inputs (eligible-contacts picker) are local-only and never hit the network.

If you add a new Settings field: prefer extending an existing row (e.g. add a column to `ChatPreferences`) and reuse `useUpdateChatPrefsMutation` rather than minting a new endpoint + key. Each new query adds a session GET and a cache-patch path to maintain.

### Build order (sequential phases — finish each before starting the next)

| Phase | What | Why first |
| ----- | ---- | --------- |
| S1    | Privacy exception picker + schema | Direct user ask; unblocks every visibility row |
| S2    | Profile / Account screen | Most-used Settings page; covers avatar upload pattern |
| S3    | Privacy switches | Builds on S1's exception picker |
| S4    | Chat preferences (theme + wallpaper) | Visible polish; relies on S2's settings query |
| S5    | Notifications | Smallest scope; mostly toggles |
| S6    | Keyboard shortcuts | Pure UI; can ship anytime |
| S7    | Optimization pass | Must run last so we can audit the full surface |
