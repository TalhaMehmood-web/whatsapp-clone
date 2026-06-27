"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useUpdateCommunityMutation } from "@/tanstack/communities/mutations";
import { COPY } from "@/config/constants";

// Same shape as newCommunitySchema but every field is treated as a
// patch — empty string ⇒ keep current value (server ignores undefined).
const schema = z.object({
  name: z.string().trim().min(1, "Community name is required").max(60),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9_.]{3,30}$/,
      "3–30 chars: lowercase letters, numbers, dot or underscore.",
    )
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(280).optional().or(z.literal("")),
});

// Owner / admin only. Opens from the 3-dot menu in the community detail
// header. Uses the existing PATCH /api/communities/[id] route, which
// already enforces assertCanManage on the server.
export function EditCommunityDialog({ open, onOpenChange, community }) {
  const update = useUpdateCommunityMutation(community?.id);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: community?.name ?? "",
      handle: community?.handle ?? "",
      description: community?.description ?? "",
    },
  });

  // Reset whenever the dialog opens so the form mirrors the latest
  // community values (in case realtime updated them between opens).
  useEffect(() => {
    if (open && community) {
      form.reset({
        name: community.name ?? "",
        handle: community.handle ?? "",
        description: community.description ?? "",
      });
    }
  }, [open, community, form]);

  const onSubmit = (values) => {
    const patch = {
      name: values.name,
      // Empty handle means "clear it" — that's a real action, not a
      // skip. Description follows the same logic.
      handle: values.handle?.trim() ? values.handle.trim() : null,
      description: values.description?.trim() || null,
    };
    update.mutate(patch, {
      onSuccess: () => onOpenChange(false),
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Could not save"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Edit community</DialogTitle>
          <DialogDescription>
            Update what people see on the invite link and inside the
            community.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4 px-6 pt-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{COPY.COMMUNITIES_NAME_LABEL}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={COPY.COMMUNITIES_NAME_PLACEHOLDER}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{COPY.COMMUNITIES_HANDLE_LABEL}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={COPY.COMMUNITIES_HANDLE_PLACEHOLDER}
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-wa-text-muted">
                      {COPY.COMMUNITIES_HANDLE_HINT}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{COPY.COMMUNITIES_DESC_LABEL}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={COPY.COMMUNITIES_DESC_PLACEHOLDER}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={update.isPending}
                loadingText="Saving…"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
