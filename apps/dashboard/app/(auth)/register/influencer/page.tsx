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
import {
  useAuthControllerRegister,
  useAuthControllerVerifyEmail,
  useAuthControllerVerifyPhone,
  useAuthControllerLogin,
  useAuthControllerResendVerificationCode,
} from "@workspace/client";
import { useAuthStore, User } from "@/lib/auth-store";
import {
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { VerificationCodeInput } from "@/components/verification-code-input";
import Image from "next/image";

type RegisterResponse = {
  accessToken: string;
  user: User;
};

type RegistrationStep =
  | "form"
  | "verify-email"
  | "verify-phone"
  | "complete";

export default function RegisterInfluencerPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [step, setStep] = useState<RegistrationStep>("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registerMutation = useAuthControllerRegister({
    mutation: {
      onSuccess: () => {
        setStep("verify-email");
      },
      onError: (error: any) => {
        setError(
          error?.response?.data?.message ||
            "Registration failed. Please try again.",
        );
      },
    },
  });

  const verifyEmailMutation = useAuthControllerVerifyEmail({
    mutation: {
      onSuccess: () => {
        setIsLoading(false);
        setStep("verify-phone");
      },
      onError: (error: any) => {
        setError(error?.response?.data?.message || "Invalid verification code");
        setIsLoading(false);
      },
    },
  });

  const verifyPhoneMutation = useAuthControllerVerifyPhone({
    mutation: {
      onSuccess: () => {
        loginMutation.mutate({
          data: {
            email: formData.email,
            password: formData.password,
          },
        });
      },
      onError: (error: any) => {
        setError(error?.response?.data?.message || "Invalid verification code");
        setIsLoading(false);
      },
    },
  });

  const loginMutation = useAuthControllerLogin({
    mutation: {
      onSuccess: (data) => {
        const response = data as unknown as RegisterResponse;
        setToken(response.accessToken);
        setUser(response.user);
        setStep("complete");
        setTimeout(() => router.push("/influencer"), 2000);
      },
      onError: (error: any) => {
        setError(error?.response?.data?.message || "Login failed");
        setIsLoading(false);
      },
    },
  });

  const resendCodeMutation = useAuthControllerResendVerificationCode({
    mutation: {
      onSuccess: () => {
        setError("");
        setIsLoading(false);
      },
      onError: (error: any) => {
        setError(error?.response?.data?.message || "Failed to resend code");
        setIsLoading(false);
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Register user directly - codes will be sent automatically
    registerMutation.mutate({
      data: {
        email: formData.email,
        password: formData.password,
        role: "influencer",
        name: formData.name,
        phone: formData.phone,
      },
    });
  };

  const handleVerifyEmail = () => {
    if (emailCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    verifyEmailMutation.mutate({
      data: {
        email: formData.email,
        code: emailCode,
      },
    });
  };

  const handleVerifyPhone = () => {
    if (phoneCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    verifyPhoneMutation.mutate({
      data: {
        phone: formData.phone,
        code: phoneCode,
      },
    });
  };

  const handleResendCode = (type: "email" | "phone") => {
    setIsLoading(true);
    setError("");

    resendCodeMutation.mutate({
      params: {
        email: formData.email,
        type: type,
      },
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Success screen
  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Registration Complete!</CardTitle>
            <CardDescription>
              Your account has been created successfully. Redirecting to
              dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      // <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      //   <Card className="w-full max-w-md">
      //     <CardHeader className="text-center space-y-4">
      //       <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
      //         <CheckCircle2 className="h-8 w-8" />
      //       </div>
      //       <CardTitle className="text-2xl">Registration Successful!</CardTitle>
      //       <CardDescription>
      //         Your influencer account has been created successfully. Please wait
      //         for admin approval before logging in.
      //       </CardDescription>
      //     </CardHeader>
      //     <CardContent className="text-center">
      //       <p className="text-sm text-muted-foreground mb-4">
      //         An admin will review your account shortly.
      //       </p>
      //       <Button asChild className="w-full">
      //         <Link href="/login">Go to Login</Link>
      //       </Button>
      //     </CardContent>
      //   </Card>
      // </div>
    );
  }

  // Email verification screen
  if (step === "verify-email") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent a 6-digit verification code to
              <br />
              <strong>{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Label className="text-center block">
                Enter verification code
              </Label>
              <VerificationCodeInput
                value={emailCode}
                onChange={setEmailCode}
                disabled={isLoading}
                error={!!error}
              />
            </div>

            <Button
              onClick={handleVerifyEmail}
              className="w-full"
              disabled={isLoading || emailCode.length !== 6}
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

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => handleResendCode("email")}
                disabled={isLoading}
                className="text-primary hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phone verification screen
  if (step === "verify-phone") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Smartphone className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
            <CardDescription>
              We&apos;ve sent a 6-digit verification code to
              <br />
              <strong>{formData.phone}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Label className="text-center block">
                Enter verification code
              </Label>
              <VerificationCodeInput
                value={phoneCode}
                onChange={setPhoneCode}
                disabled={isLoading}
                error={!!error}
              />
            </div>

            <Button
              onClick={handleVerifyPhone}
              className="w-full"
              disabled={isLoading || phoneCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Phone & Complete"
              )}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => handleResendCode("phone")}
                disabled={isLoading}
                className="text-primary hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form (default step)
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-fit -ml-2 mb-2"
          >
            <Link href="/register">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden">
            <Image
              src="/1MAN1000-logo.png"
              alt="1man1000"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-center">
            Create Influencer Account
          </CardTitle>
          <CardDescription className="text-center">
            Register as an influencer to participate in campaigns and earn money
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
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
                <p className="text-xs text-muted-foreground">
                  Min 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Influencer Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            <p className="text-muted-foreground">
              Want to register as a client?{" "}
              <Link
                href="/register/client"
                className="text-primary hover:underline font-medium"
              >
                Click here
              </Link>
            </p>
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
