"use client";

import { useRef } from "react";
import { AtSign, Camera, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import {
  useDeleteAvatarMutation,
  useUpdateAboutMutation,
  useUpdateAvatarMutation,
  useUpdateMeMutation,
} from "@/tanstack/users/mutations";
import { COPY } from "@/config/constants";
import {
  SettingsSection,
  SettingsGroupLabel,
} from "@/features/settings/shared/settings-section";
import { InlineEditRow } from "./inline-edit-row";

export function ProfileEditor({ inline = false }) {
  const { user } = useAuth();
  const fileRef = useRef(null);

  const updateMe = useUpdateMeMutation();
  const updateAbout = useUpdateAboutMutation();
  const uploadAvatar = useUpdateAvatarMutation();
  const deleteAvatar = useDeleteAvatarMutation();

  const onPick = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    uploadAvatar.mutate(file, {
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Upload failed"),
    });
  };

  const copyPhone = () => {
    if (!user?.phone) return;
    navigator.clipboard.writeText(user.phone);
    toast.success(COPY.PROFILE_PHONE_COPIED);
  };

  const copyHandle = () => {
    if (!user?.handle) return;
    navigator.clipboard.writeText(`@${user.handle}`);
    toast.success(COPY.PROFILE_HANDLE_COPIED);
  };

  const setAboutPreset = (preset) => {
    if (preset === user?.about) return;
    updateAbout.mutateAsync(preset).catch((err) =>
      toast.error(err.response?.data?.error ?? "Failed"),
    );
  };

  return (
    <SettingsSection title={COPY.PROFILE_EDIT_TITLE} inline={inline}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPick}
      />

      <div className="flex flex-col items-center gap-3 px-6 pb-2 pt-6 text-center">
        <Avatar className="size-32">
          <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
          <AvatarFallback className="bg-wa-panel-3 text-2xl">
            {(user?.name ?? "??").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            loading={uploadAvatar.isPending}
          >
            <Camera className="mr-2 size-4" />
            {COPY.PROFILE_EDIT_BUTTON}
          </Button>
          {user?.avatar && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                deleteAvatar.mutate(undefined, {
                  onError: (err) =>
                    toast.error(err.response?.data?.error ?? "Failed"),
                })
              }
              loading={deleteAvatar.isPending}
              className="text-wa-text-muted hover:text-wa-text"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <Separator className="mt-4" />
      {/* InlineEditRow renders its own green label, so no SettingsGroupLabel here. */}
      <InlineEditRow
        label={COPY.PROFILE_ABOUT_LABEL}
        value={user?.about ?? ""}
        placeholder="Hey there! I am using WhatsApp."
        maxLength={140}
        multiline
        saving={updateAbout.isPending}
        onSave={(about) =>
          updateAbout.mutateAsync(about).catch((err) =>
            toast.error(err.response?.data?.error ?? "Failed"),
          )
        }
      />
      <div className="px-6 pb-4">
        <p className="pb-2 text-xs text-wa-text-muted">
          {COPY.PROFILE_ABOUT_PRESETS_HINT}
        </p>
        <div className="flex flex-wrap gap-2">
          {COPY.PROFILE_ABOUT_PRESETS.map((preset) => {
            const active = preset === user?.about;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setAboutPreset(preset)}
                disabled={updateAbout.isPending}
                className={
                  active
                    ? "rounded-full bg-wa-green-soft px-3 py-1 text-xs text-wa-green"
                    : "rounded-full bg-wa-panel-2 px-3 py-1 text-xs text-wa-text-muted transition-colors hover:bg-wa-panel-3 hover:text-wa-text"
                }
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />
      <SettingsGroupLabel>{COPY.PROFILE_HANDLE_LABEL}</SettingsGroupLabel>
      <div className="flex items-center justify-between px-6 py-3">
        <span className="flex items-center gap-1 truncate text-sm text-wa-text">
          <AtSign className="size-4 text-wa-text-muted" />
          {user?.handle ?? "—"}
        </span>
        {user?.handle && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copy username"
            onClick={copyHandle}
            className="text-wa-text-muted hover:text-wa-text"
          >
            <Copy className="size-4" />
          </Button>
        )}
      </div>

      <Separator />
      <InlineEditRow
        label={COPY.PROFILE_NAME_LABEL}
        value={user?.name ?? ""}
        placeholder="Your name"
        maxLength={60}
        saving={updateMe.isPending}
        onSave={(name) =>
          updateMe.mutateAsync({ name }).catch((err) =>
            toast.error(err.response?.data?.error ?? "Failed"),
          )
        }
      />

      <Separator />
      <SettingsGroupLabel>{COPY.PROFILE_PHONE_LABEL}</SettingsGroupLabel>
      <div className="flex items-center justify-between px-6 py-3">
        <span className="truncate text-sm text-wa-text">
          {user?.phone ?? "—"}
        </span>
        {user?.phone && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copy phone"
            onClick={copyPhone}
            className="text-wa-text-muted hover:text-wa-text"
          >
            <Copy className="size-4" />
          </Button>
        )}
      </div>
    </SettingsSection>
  );
}
