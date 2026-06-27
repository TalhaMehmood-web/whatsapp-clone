"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BellOff,
  Crown,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import {
  useChannelAdminsQuery,
  useChannelQuery,
} from "@/tanstack/channels/queries";
import {
  useDeleteChannelMutation,
  useMuteChannelMutation,
  useRemoveChannelAdminMutation,
  useReportChannelMutation,
  useSetChannelPrivacyMutation,
} from "@/tanstack/channels/mutations";
import { CHANNEL_MAX_ADMINS, COPY, ROUTES } from "@/config/constants";
import { cn } from "@/utils/cn";

import { AddChannelAdminDialog } from "./add-admin-dialog";
import { ChannelSubscribersSheet } from "./channel-subscribers-sheet";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";

// Right-side "Channel info" panel that replaces the chat-header 3-dot
// menu's grab-bag. Mirrors the WhatsApp layout from the user's
// screenshot: hero → alerts → invite link → admins strip → transfer →
// delete → report.
//
// The component reads from useChannelQuery (already cached on the
// channel-detail page) so opening the sheet doesn't fire a fresh
// network round-trip — only the on-demand admins query does.
export function ChannelInfoSheet({ open, onOpenChange, channelId }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: channel } = useChannelQuery(channelId);
  const { data: adminsData, isLoading: adminsLoading } = useChannelAdminsQuery(
    channelId,
    { enabled: open && !!channelId },
  );
  const mute = useMuteChannelMutation(channelId);
  const setPrivacy = useSetChannelPrivacyMutation(channelId);
  const removeAdmin = useRemoveChannelAdminMutation(channelId);
  const del = useDeleteChannelMutation();
  const report = useReportChannelMutation(channelId);

  const [subscribersOpen, setSubscribersOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // "delete" | "report" | null
  const [reportReason, setReportReason] = useState("");

  if (!channel) return null;

  const isOwner = channel.isOwner;
  const isAdmin = channel.isAdmin;
  const isMuted = !!channel.mutedUntil;
  const owner = adminsData?.owner;
  const admins = adminsData?.admins ?? [];
  const initials = (channel.name ?? "??").slice(0, 2).toUpperCase();
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ch/${channel.handle}`
      : null;
  const allAdminIds = [
    ...(owner ? [owner.id] : []),
    ...admins.map((a) => a.id),
  ];
  const remainingSlots = Math.max(0, CHANNEL_MAX_ADMINS - admins.length);

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied");
  };

  const onToggleMute = () => {
    const next = isMuted
      ? null
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 50).toISOString();
    mute.mutate(next, {
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to mute"),
    });
  };

  const onTogglePrivacy = () => {
    setPrivacy.mutate(!channel.isPrivate, {
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to update"),
    });
  };

  const onRemoveAdmin = (userId) =>
    removeAdmin.mutate(userId, {
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Failed to remove admin"),
    });

  const onConfirmDelete = () =>
    del.mutate(channelId, {
      onSuccess: () => {
        setConfirm(null);
        onOpenChange(false);
        router.replace(ROUTES.CHANNELS);
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Failed to delete");
      },
    });

  const onConfirmReport = () =>
    report.mutate(reportReason.trim() || undefined, {
      onSuccess: () => {
        setConfirm(null);
        setReportReason("");
        toast.success("Report submitted");
      },
      onError: (err) => {
        setConfirm(null);
        toast.error(err.response?.data?.error ?? "Failed to report");
      },
    });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col gap-0 overflow-hidden border-wa-border bg-wa-panel p-0 text-wa-text sm:max-w-md"
        >
          <SheetHeader className="flex-row items-center gap-3 space-y-0 border-b border-wa-border px-3 py-3 text-left">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <X className="size-4" />
            </Button>
            <SheetTitle className="text-base font-medium text-wa-text">
              Channel info
            </SheetTitle>
            <SheetDescription className="sr-only">
              Channel info: alerts, link, admins, transfer, delete, report.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
              <Avatar className="size-32">
                <AvatarImage src={channel.photo ?? undefined} alt={channel.name} />
                <AvatarFallback className="bg-wa-panel-3 text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-medium text-wa-text">
                  {channel.name}
                </h2>
                <p className="text-sm text-wa-text-muted">@{channel.handle}</p>
                {channel.description && (
                  <p className="mt-3 text-sm text-wa-text-muted">
                    {channel.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSubscribersOpen(true)}
                className="flex items-center gap-1 text-xs text-wa-text-muted hover:text-wa-text"
              >
                <Users className="size-3" />
                {channel.subscriberCount ?? 0}{" "}
                {channel.subscriberCount === 1 ? "follower" : "followers"}
              </button>
            </div>

            <Separator />

            {/* Alerts (re-uses the channel-mute mutation; same semantics
                as WhatsApp's "Channel alerts" toggle). */}
            <Row
              icon={BellOff}
              label="Channel alerts"
              sublabel={isMuted ? "Muted" : "On"}
              onClick={onToggleMute}
              disabled={mute.isPending || !channel.isSubscribed}
            />

            <Row
              icon={LinkIcon}
              label="Channel link"
              sublabel={inviteUrl ? `whatsapp.app/ch/${channel.handle}` : null}
              onClick={copyInvite}
            />

            {isOwner && (
              <Row
                icon={channel.isPrivate ? EyeOff : Eye}
                label={channel.isPrivate ? "Private channel" : "Public channel"}
                sublabel={
                  channel.isPrivate
                    ? "Only reachable by invite link"
                    : "Visible in Explore + search"
                }
                onClick={onTogglePrivacy}
                disabled={setPrivacy.isPending}
              />
            )}

            <Separator />

            {/* Admins strip */}
            <div className="flex items-center justify-between px-6 py-3">
              <h3 className="text-[11px] uppercase tracking-wider text-wa-text-muted">
                Admins · {1 + admins.length}
              </h3>
              {isOwner && remainingSlots > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddAdminOpen(true)}
                  className="text-wa-green hover:text-wa-green/90"
                >
                  <UserPlus className="mr-1 size-4" /> Invite admin
                </Button>
              )}
            </div>

            {adminsLoading ? (
              <div className="flex justify-center py-4 text-wa-text-muted">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : (
              <ul className="flex flex-col">
                {owner && (
                  <AdminRow
                    user={owner}
                    role="owner"
                    canRemove={false}
                  />
                )}
                {admins.map((a) => (
                  <AdminRow
                    key={a.id}
                    user={a}
                    role="admin"
                    canRemove={isOwner}
                    onRemove={() => onRemoveAdmin(a.id)}
                    busy={removeAdmin.isPending}
                  />
                ))}
              </ul>
            )}

            <Separator />

            {/* Owner actions */}
            {isOwner && (
              <>
                <Row
                  icon={Crown}
                  label="Transfer ownership"
                  sublabel="Hand the channel to an admin"
                  onClick={() => setTransferOpen(true)}
                  disabled={admins.length === 0}
                />
                <Row
                  icon={Trash2}
                  label="Delete channel"
                  destructive
                  onClick={() => setConfirm("delete")}
                />
              </>
            )}

            {/* Non-owner actions */}
            {!isOwner && (
              <Row
                icon={AlertTriangle}
                label="Report channel"
                destructive
                onClick={() => setConfirm("report")}
              />
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ChannelSubscribersSheet
        open={subscribersOpen}
        onOpenChange={setSubscribersOpen}
        channelId={channelId}
      />

      <AddChannelAdminDialog
        open={addAdminOpen}
        onOpenChange={setAddAdminOpen}
        channelId={channelId}
        existingAdminIds={allAdminIds}
        remainingSlots={remainingSlots}
      />

      <TransferOwnershipDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        channelId={channelId}
        admins={admins}
      />

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(v) => !v && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? "Delete this channel?"
                : "Report this channel?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "Every post, reaction, and reply will be removed permanently. This can't be undone."
                : "We'll keep your report private. The channel owner won't be notified."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirm === "report" && (
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="Optional: tell us what's wrong"
              className="mt-1 w-full rounded-md border border-wa-border bg-wa-panel-2 px-3 py-2 text-sm text-wa-text placeholder:text-wa-text-muted focus:outline-none focus:ring-1 focus:ring-wa-green"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{COPY.CONFIRM_CANCEL}</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                confirm === "delete" ? onConfirmDelete : onConfirmReport
              }
              className="bg-wa-danger text-white hover:bg-wa-danger/90"
            >
              {confirm === "delete" ? "Delete channel" : "Submit report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  sublabel,
  onClick,
  destructive,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-wa-panel-2 disabled:opacity-50 disabled:hover:bg-transparent",
        destructive && "text-wa-danger",
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0",
          destructive ? "text-wa-danger" : "text-wa-text-muted",
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "truncate text-sm",
            destructive ? "text-wa-danger" : "text-wa-text",
          )}
        >
          {label}
        </span>
        {sublabel && (
          <span className="truncate text-xs text-wa-text-muted">{sublabel}</span>
        )}
      </div>
    </button>
  );
}

function AdminRow({ user, role, canRemove, onRemove, busy }) {
  const initials = (user.name ?? "??").slice(0, 2).toUpperCase();
  return (
    <li className="flex items-center gap-3 px-6 py-2.5">
      <Avatar className="size-10">
        <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
        <AvatarFallback className="bg-wa-panel-3 text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-wa-text">{user.name}</span>
        <span className="flex items-center gap-1 truncate text-xs text-wa-text-muted">
          {role === "owner" ? (
            <>
              <Crown className="size-3" /> Owner
            </>
          ) : (
            <>
              <Shield className="size-3" /> Admin
            </>
          )}
        </span>
      </div>
      {canRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove admin"
          disabled={busy}
          onClick={onRemove}
          className="text-wa-text-muted hover:text-wa-danger"
        >
          <UserMinus className="size-4" />
        </Button>
      )}
    </li>
  );
}
