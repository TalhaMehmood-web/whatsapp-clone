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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useUpdateChannelMutation } from "@/tanstack/channels/mutations";

const schema = z.object({
  description: z.string().trim().max(280),
});

export function EditDescriptionDialog({
  open,
  onOpenChange,
  channelId,
  initialValue,
}) {
  const update = useUpdateChannelMutation(channelId);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { description: initialValue ?? "" },
  });

  useEffect(() => {
    if (open) form.reset({ description: initialValue ?? "" });
  }, [open, initialValue, form]);

  const onSubmit = (values) =>
    update.mutate(
      { description: values.description.trim() || null },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) =>
          toast.error(err.response?.data?.error ?? "Could not save"),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Channel description</DialogTitle>
          <DialogDescription>
            Tell people what this channel is about. Up to 280 characters.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="px-6 pt-3">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Add a short description"
                        rows={4}
                        autoFocus
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
              <Button type="submit" loading={update.isPending} loadingText="Saving…">
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
