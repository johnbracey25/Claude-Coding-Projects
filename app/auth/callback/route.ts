import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  // Supabase appends its own error details when a link is expired/used.
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  const fail = (msg: string) =>
    NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, request.url)
    );

  if (providerError) {
    return fail(`${providerError}. Please request a new reset link.`);
  }

  const supabase = createClient();

  // PKCE flow: exchange the one-time code for a session.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    return fail("That reset link didn't work. Please request a new one.");
  }

  // OTP/token-hash flow (depends on the email template used).
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "recovery" | "email" | "signup",
    });
    if (!error) {
      const dest = type === "recovery" ? "/login/reset" : next;
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return fail("That reset link has expired. Please request a new one.");
  }

  return fail("Reset link expired or invalid. Please try again.");
}
