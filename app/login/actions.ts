"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * The origin the user is actually on, derived from the request. This is more
 * reliable than NEXT_PUBLIC_APP_URL (which is easy to leave unset in prod and
 * would otherwise send reset links to localhost).
 */
function requestOrigin(): string {
  const h = headers();
  const host = h.get("host");
  if (host) {
    const proto =
      h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard") || "/dashboard";

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const { data: aalData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (
    aalData &&
    aalData.nextLevel === "aal2" &&
    aalData.currentLevel !== "aal2"
  ) {
    redirect(`/login/verify?next=${encodeURIComponent(next)}`);
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function resetPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/login?error=Please+enter+your+email+first.");
  }

  const supabase = createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${requestOrigin()}/auth/callback?next=/login/reset`,
  });

  redirect(
    `/login?notice=${encodeURIComponent("If that email is on file, you'll receive a reset link shortly. Check your inbox (and spam).")}`
  );
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
