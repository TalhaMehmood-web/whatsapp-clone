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
import { useCreateCommunityMutation } from "@/tanstack/communities/mutations";
import { COPY, ROUTES } from "@/config/constants";
import { newCommunitySchema } from "./schema";

export function NewCommunityModal({ open, onOpenChange }) {
  const router = useRouter();
  const create = useCreateCommunityMutation();

  const form = useForm({
    resolver: zodResolver(newCommunitySchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!open) form.reset({ name: "", description: "" });
  }, [open, form]);

  const onSubmit = (values) =>
    create.mutate(
      {
        name: values.name,
        description: values.description?.trim() || undefined,
      },
      {
        onSuccess: (community) => {
          onOpenChange(false);
          router.push(`${ROUTES.COMMUNITIES}/${community.id}`);
        },
        onError: (err) =>
          toast.error(
            err.response?.data?.error ?? "Could not create community",
          ),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{COPY.COMMUNITIES_NEW_TITLE}</DialogTitle>
          <DialogDescription>{COPY.COMMUNITIES_NEW_DESC}</DialogDescription>
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
                type="submit"
                loading={create.isPending}
                loadingText="Creating…"
              >
                {COPY.COMMUNITIES_CREATE}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
