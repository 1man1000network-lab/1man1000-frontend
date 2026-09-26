"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, User } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

interface SocialCallbackClientProps {
  token?: string;
  user?: User;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  requiresVerification?: boolean;
}

export function SocialCallbackClient({
  token,
  user,
  emailVerified,
  phoneVerified,
  requiresVerification,
}: SocialCallbackClientProps) {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    if (!token || !user) {
      router.replace("/login");
      return;
    }

    setToken(token);
    setUser(user);

    if (requiresVerification) {
      const phone = user.phone || "";
      if (!emailVerified) {
        router.replace(
          `/verify/email?email=${encodeURIComponent(user.email)}&phone=${encodeURIComponent(phone)}&role=${encodeURIComponent(user.role)}`,
        );
      } else if (!phoneVerified) {
        router.replace(
          `/verify/phone?email=${encodeURIComponent(user.email)}&phone=${encodeURIComponent(phone)}`,
        );
      }
      return;
    }

    const redirectPath =
      user.role === "admin"
        ? "/admin"
        : user.role === "client"
          ? "/client"
          : "/influencer";
    router.replace(redirectPath);
  }, [
    token,
    user,
    emailVerified,
    phoneVerified,
    requiresVerification,
    router,
    setUser,
    setToken,
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
