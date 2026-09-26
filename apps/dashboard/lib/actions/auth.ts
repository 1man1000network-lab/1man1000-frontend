"use server";

import { signIn } from "@/auth";
import { cookies } from "next/headers";

export async function googleSignInAction(
  role?: "influencer" | "client",
): Promise<void> {
  const cookieStore = await cookies();
  if (role) {
    cookieStore.set("oauth_role", role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
  } else {
    cookieStore.delete("oauth_role");
  }
  await signIn("google", { redirectTo: "/social-callback" });
}
