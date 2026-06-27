"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Sparkles, UserPlus, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { COPY, ROUTES } from "@/config/constants";

// The right-pane placeholder shown when no chat / status / community is open.
// Mirrors WhatsApp Web's "Download WhatsApp for Windows" promo card with the
// three pill actions docked at the bottom of the pane.
export function EmptyDetailPane() {
  const router = useRouter();
  const openNewChat = useUiStore((s) => s.openNewChat);

  // Send document → open the friend-picker with an intent. After the
  // user picks a chat the modal navigates to it with ?attach=document,
  // which the chat's AttachMenu reads and uses to auto-open the OS
  // file picker filtered to docs. Two clicks instead of one, but no
  // dedicated "pick-and-send" sheet to build.
  const onSendDocument = () => openNewChat({ intent: "document" });

  // Add contact → /search is the global user-search page where the
  // user can search by name/handle/email/phone and send a friend
  // request. That's the closest semantic in this app (we don't have a
  // device-contacts API to import from).
  const onAddContact = () => router.push(ROUTES.SEARCH_PAGE);

  // Ask Meta AI — we don't ship an LLM with this app. Keep the
  // affordance for visual parity with WhatsApp Web but be honest about
  // it instead of routing to a half-built screen.
  const onAskAi = () =>
    toast.info("AI assistant isn't part of this build.");

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-wa-bg px-6">
      <div className="flex max-w-md flex-col items-center rounded-2xl bg-wa-panel px-10 py-12 text-center shadow-lg">
        <BookmarkLaptopArt />
        <h2 className="mt-6 text-2xl font-light text-wa-text">
          {COPY.EMPTY_DOWNLOAD_TITLE}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-wa-text-muted">
          {COPY.EMPTY_DOWNLOAD_BODY}
        </p>
        <Button className="mt-6 rounded-full bg-wa-green px-6 text-white hover:bg-wa-green/90">
          {COPY.EMPTY_DOWNLOAD_CTA}
        </Button>
      </div>

      <div className="mt-10 flex items-center gap-3">
        <PillAction icon={FileText} label={COPY.EMPTY_PILL_DOC} onClick={onSendDocument} />
        <PillAction icon={UserPlus} label={COPY.EMPTY_PILL_CONTACT} onClick={onAddContact} />
        <PillAction icon={Sparkles} label={COPY.EMPTY_PILL_AI} onClick={onAskAi} />
      </div>

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-wa-text-muted/70">
        <Phone className="mr-1 inline size-3" />
        {COPY.ENCRYPTED_FOOTER}
      </p>
    </div>
  );
}

function PillAction({ icon: Icon, label, onClick }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="flex h-auto flex-col items-center gap-2 rounded-2xl bg-wa-panel-2 px-6 py-4 text-xs text-wa-text hover:bg-wa-panel-3"
    >
      <Icon className="size-5 text-wa-text-muted" />
      {label}
    </Button>
  );
}

function BookmarkLaptopArt() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="14"
        y="22"
        width="76"
        height="50"
        rx="6"
        fill="#D9FDD3"
        stroke="#00A884"
        strokeWidth="2"
      />
      <rect x="8" y="74" width="88" height="6" rx="2" fill="#00A884" />
      <rect
        x="60"
        y="34"
        width="44"
        height="60"
        rx="6"
        fill="#FFFFFF"
        stroke="#00A884"
        strokeWidth="2"
      />
      <circle cx="82" cy="58" r="10" fill="#D9FDD3" />
      <path
        d="M78 58 L82 62 L88 54"
        stroke="#00A884"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="68" y="78" width="28" height="3" rx="1.5" fill="#D9FDD3" />
      <rect x="68" y="84" width="20" height="3" rx="1.5" fill="#D9FDD3" />
    </svg>
  );
}
