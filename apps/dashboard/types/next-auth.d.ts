import type { User } from "@/lib/auth-store";

declare module "next-auth" {
  interface Session {
    backendToken?: string;
    backendUser?: User;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    requiresVerification?: boolean;
    backendError?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    backendUser?: User;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    requiresVerification?: boolean;
    backendError?: boolean;
  }
}
