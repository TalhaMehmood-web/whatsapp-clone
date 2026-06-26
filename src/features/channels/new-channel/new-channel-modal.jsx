"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useCreateChannelMutation } from "@/tanstack/channels/mutations";
import { COPY, ROUTES } from "@/config/constants";
import { newChannelSchema } from "./schema";

export function NewChannelModal({ open, onOpenChange }) {
  const router = useRouter();
  const create = useCreateChannelMutation();

  const form = useForm({
    resolver: zodResolver(newChannelSchema),
    defaultValues: { name: "", handle: "", description: "" },
  });

  useEffect(() => {
    if (!open) form.reset({ name: "", handle: "", description: "" });
  }, [open, form]);

  const onSubmit = (values) =>
    create.mutate(
      {
        name: values.name,
        handle: values.handle.toLowerCase().replace(/^@/, ""),
        description: values.description?.trim() || undefined,
      },
      {
        onSuccess: (channel) => {
          onOpenChange(false);
          router.push(`${ROUTES.CHANNELS}/${channel.id}`);
        },
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not create channel"),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{COPY.CHANNELS_NEW_TITLE}</DialogTitle>
          <DialogDescription>{COPY.CHANNELS_NEW_DESC}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4 px-6 pt-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{COPY.CHANNELS_NAME_LABEL}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={COPY.CHANNELS_NAME_PLACEHOLDER}
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
                    <FormLabel>{COPY.CHANNELS_HANDLE_LABEL}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-wa-text-muted">
                          @
                        </span>
                        <Input
                          placeholder={COPY.CHANNELS_HANDLE_PLACEHOLDER}
                          className="pl-7"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{COPY.CHANNELS_DESC_LABEL}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={COPY.CHANNELS_DESC_PLACEHOLDER}
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
                type="submit"
                loading={create.isPending}
                loadingText="Creating…"
              >
                {COPY.CHANNELS_CREATE}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
