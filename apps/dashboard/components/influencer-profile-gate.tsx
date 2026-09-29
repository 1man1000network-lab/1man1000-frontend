"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import {
  useAuthControllerGetProfile,
  type ProfileResponseDto,
} from "@workspace/client";
import { useAuthStore } from "@/lib/auth-store";

interface InfluencerProfileGateProps {
  children: React.ReactNode;
}

export function InfluencerProfileGate({
  children,
}: InfluencerProfileGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const { data: profile, isLoading } = useAuthControllerGetProfile({
    query: {
      enabled: !!user && user.role === "influencer",
      staleTime: 15_000,
    },
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== "influencer") return;

    if (pathname === "/influencer/complete-profile") return;

    if (isLoading) return;

    const typedProfile = profile as ProfileResponseDto | undefined;
    const status = typedProfile?.status ?? user.status;
    const profileCompleted =
      typedProfile?.profileCompleted ?? user.profileCompleted;

    if (status === "approved" && profileCompleted === false) {
      router.push("/influencer/complete-profile");
    }
  }, [user, profile, isLoading, pathname, router]);

  const typedProfile = profile as ProfileResponseDto | undefined;
  const isFlagged = typedProfile?.isFlagged ?? false;
  const flagReason = typedProfile?.flagReason;
  const flaggedAt = typedProfile?.flaggedAt;

  return (
    <>
      {isFlagged && (
        <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <Flag className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-700 dark:text-amber-500">
                Your account has been flagged
              </p>
              <p className="text-sm text-amber-700/90 dark:text-amber-400/90">
                {flagReason ||
                  "Your account is under review for a policy violation."}
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                {flaggedAt
                  ? `Flagged on ${new Date(flaggedAt).toLocaleDateString()}. `
                  : ""}
                If you believe this is a mistake, please contact support.
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
