"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  useAuthControllerVerifyEmail,
  useAuthControllerResendVerificationCode,
} from "@workspace/client";
import { Loader2, Mail } from "lucide-react";
import { VerificationCodeInput } from "@/components/verification-code-input";

function VerifyEmailPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const role = searchParams.get("role") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const verifyMutation = useAuthControllerVerifyEmail({
    mutation: {
      onSuccess: () => {
        setIsLoading(false);
        if (role === "influencer") {
          router.push(
            `/verify/phone?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`,
          );
        } else {
          router.push("/login");
        }
      },
      onError: () => {
        setError("Invalid or expired verification code");
        setIsLoading(false);
      },
    },
  });

  const resendMutation = useAuthControllerResendVerificationCode({
    mutation: {
      onSuccess: () => {
        setError("");
        setIsLoading(false);
      },
      onError: () => {
        setError("Failed to resend verification code");
        setIsLoading(false);
      },
    },
  });

  const handleVerify = () => {
    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");
    verifyMutation.mutate({ data: { email, code } });
  };

  const handleResend = () => {
    setIsLoading(true);
    setError("");
    resendMutation.mutate({
      params: { email, type: "email" },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to
            <br />
            <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Label className="text-center block">Enter verification code</Label>
            <VerificationCodeInput
              value={code}
              onChange={setCode}
              disabled={isLoading}
              error={!!error}
            />
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>

          <div className="text-center text-sm space-y-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="text-primary hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
            <p className="text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPageInner />
    </Suspense>
  );
}
