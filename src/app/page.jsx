import { redirect } from "next/navigation";
import { ROUTES } from "@/config/constants";

export default function RootPage() {
  redirect(ROUTES.CHAT_INDEX);
}
