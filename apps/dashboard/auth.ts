import NextAuth, { NextAuthResult, Session } from "next-auth";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:6004";

const result = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const firstName =
          ((profile as Record<string, unknown>).given_name as string) ||
          (typeof profile.name === "string"
            ? profile.name.split(" ")[0]
            : "") ||
          "";
        const lastName =
          ((profile as Record<string, unknown>).family_name as string) ||
          (typeof profile.name === "string"
            ? profile.name.split(" ").slice(1).join(" ")
            : "") ||
          "";

        try {
          const cookieStore = await cookies();
          const role = cookieStore.get("oauth_role")?.value;
          const res = await fetch(`${API_URL}/api/auth/social`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-service-secret": process.env.AUTH_SERVICE_SECRET!,
            },
            body: JSON.stringify({
              provider: account.provider,
              email: profile.email,
              firstName,
              lastName,
              providerAccountId: account.providerAccountId,
              role,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.accessToken as string;
            token.backendUser = data.user;
            token.emailVerified = data.emailVerified as boolean;
            token.phoneVerified = data.phoneVerified as boolean;
            token.requiresVerification =
              data.requiresVerification as boolean;
          } else {
            token.backendError = true;
          }
        } catch {
          token.backendError = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string | undefined;
      session.backendUser = token.backendUser as
        | Session["backendUser"]
        | undefined;
      session.emailVerified = token.emailVerified as boolean | undefined;
      session.phoneVerified = token.phoneVerified as boolean | undefined;
      session.requiresVerification = token.requiresVerification as
        | boolean
        | undefined;
      session.backendError = token.backendError as boolean | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
