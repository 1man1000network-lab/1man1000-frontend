"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { useAuthControllerLogin } from "@workspace/client";
import { useAuthStore, User } from "@/lib/auth-store";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { GoogleSignInButton } from "@/components/auth/social-buttons";

type LoginResponse = {
  accessToken: string;
  user: User;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  requiresVerification?: boolean;
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useAuthControllerLogin({
    mutation: {
      onSuccess: (data) => {
        const response = data as unknown as LoginResponse;
        setToken(response.accessToken);
        setUser(response.user);

        // Check if user needs verification (not admin)
        if (response.requiresVerification) {
          // Navigate to appropriate verification screen
          const phone = response.user.phone || "";
          const role = response.user.role || "";
          if (!response.emailVerified) {
            router.push(
              `/verify/email?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&role=${encodeURIComponent(role)}`,
            );
          } else if (!response.phoneVerified) {
            router.push(
              `/verify/phone?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`,
            );
          }
          return;
        }

        // User is verified or is admin, proceed to dashboard
        const redirectPath =
          response.user.role === "admin"
            ? "/admin"
            : response.user.role === "client"
              ? "/client"
              : "/influencer";

        router.push(redirectPath);
      },
      onError: () => {
        setError("Invalid email or password");
      },
    },
  });

  const isLoading = loginMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden">
            <Image
              src="/1MAN1000-logo.png"
              alt="1man1000"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your 1man1000 account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-4">
            <GoogleSignInButton />
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
