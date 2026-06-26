"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useLoginMutation } from "@/tanstack/auth/mutations";
import { loginSchema } from "./schema";
import { ROUTES } from "@/config/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function LoginForm() {
  const router = useRouter();
  const { mutate, isPending } = useLoginMutation();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = (values) =>
    mutate(values, {
      onSuccess: () => {
        toast.success("Welcome back");
        router.replace(ROUTES.CHAT_INDEX);
      },
      onError: (err) =>
        toast.error(err.response?.data?.error ?? "Login failed"),
    });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Log in to continue to WhatsApp.</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or phone</FormLabel>
                  <FormControl>
                    <Input autoComplete="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="justify-between pt-6">
            <Button asChild variant="link" className="px-0">
              <Link href={ROUTES.REGISTER}>Create account</Link>
            </Button>
            <Button type="submit" loading={isPending} loadingText="Signing in…">
              Log in
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
