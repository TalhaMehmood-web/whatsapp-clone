"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import {
  useDeleteAccountMutation,
  useUpdateMeMutation,
} from "@/tanstack/users/mutations";
import { COPY, ROUTES } from "@/config/constants";
import {
  SettingsSection,
  SettingsGroupLabel,
} from "@/features/settings/shared/settings-section";
import {
  SettingNavRow,
  SettingToggleRow,
} from "@/features/settings/shared/setting-toggle-row";

export function AccountSettings({ inline = false }) {
  const router = useRouter();
  const { user } = useAuth();
  const updateMe = useUpdateMeMutation();
  const deleteAccount = useDeleteAccountMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmHandle, setConfirmHandle] = useState("");

  const onToggleSecurity = (value) =>
    updateMe.mutate(
      { securityNotifications: value },
      {
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Failed to update"),
      },
    );

  const onRequestInfo = () => toast.info(COPY.ACCOUNT_REQUEST_INFO_COMING);

  const closeConfirm = () => {
    if (deleteAccount.isPending) return;
    setConfirmOpen(false);
    setConfirmHandle("");
  };

  const onConfirmDelete = async () => {
    const cleaned = confirmHandle.trim().replace(/^@/, "");
    if (!cleaned || cleaned.toLowerCase() !== (user?.handle ?? "").toLowerCase()) {
      toast.error("Handle does not match");
      return;
    }
    try {
      await deleteAccount.mutateAsync(cleaned);
      setConfirmOpen(false);
      // The mutation already cleared the auth store + query cache, so
      // the auth guard would bounce us anyway — but a hard nav is more
      // honest than briefly flashing an empty chat list.
      router.replace(ROUTES.LOGIN);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to delete account");
    }
  };

  return (
    <SettingsSection title={COPY.SETTINGS_ACCOUNT} inline={inline}>
      <SettingsGroupLabel>Security</SettingsGroupLabel>
      <SettingToggleRow
        title={COPY.ACCOUNT_SECURITY}
        description={COPY.ACCOUNT_SECURITY_DESC}
        checked={user?.securityNotifications ?? true}
        onChange={onToggleSecurity}
        disabled={updateMe.isPending}
      />

      <Separator className="my-2" />
      <SettingsGroupLabel>Account</SettingsGroupLabel>
      <SettingNavRow
        icon={FileText}
        title={COPY.ACCOUNT_REQUEST_INFO}
        description={COPY.ACCOUNT_REQUEST_INFO_DESC}
        onClick={onRequestInfo}
      />
      <SettingNavRow
        icon={Trash2}
        title={COPY.ACCOUNT_DELETE}
        description={COPY.ACCOUNT_DELETE_DESC}
        onClick={() => setConfirmOpen(true)}
      />

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => (open ? setConfirmOpen(true) : closeConfirm())}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{COPY.ACCOUNT_DELETE_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              {COPY.ACCOUNT_DELETE_BODY}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-wa-text-muted">
              {user?.handle
                ? COPY.ACCOUNT_DELETE_CONFIRM_LABEL(user.handle)
                : ""}
            </label>
            <Input
              value={confirmHandle}
              onChange={(e) => setConfirmHandle(e.target.value)}
              placeholder={COPY.ACCOUNT_DELETE_CONFIRM_PLACEHOLDER}
              autoFocus
              disabled={deleteAccount.isPending}
            />
          </div>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              onClick={closeConfirm}
              disabled={deleteAccount.isPending}
            >
              {COPY.CONFIRM_CANCEL}
            </Button>
            <Button
              onClick={onConfirmDelete}
              disabled={deleteAccount.isPending}
              className="bg-wa-danger text-white hover:bg-wa-danger/90"
            >
              {deleteAccount.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {COPY.ACCOUNT_DELETE_BUTTON}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shield row only acts as a visual anchor for the Security label. */}
      <span className="sr-only" aria-hidden>
        <ShieldCheck />
      </span>
    </SettingsSection>
  );
}
