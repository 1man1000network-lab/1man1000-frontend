import { auth } from "@/auth";
import { SocialCallbackClient } from "./social-callback-client";

export default async function SocialCallbackPage() {
  const session = await auth();

  return (
    <SocialCallbackClient
      token={session?.backendToken}
      user={session?.backendUser}
      emailVerified={session?.emailVerified}
      phoneVerified={session?.phoneVerified}
      requiresVerification={session?.requiresVerification}
    />
  );
}
