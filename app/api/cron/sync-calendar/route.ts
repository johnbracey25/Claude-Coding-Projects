import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { syncFromIcal } from "@/lib/calendar-sync";

export const dynamic = "force-dynamic";

/**
 * Scheduled + on-demand calendar sync. Called by Vercel Cron (see vercel.json)
 * to refresh availability from the iCal feed. If CRON_SECRET is set, requests
 * must include it as `?key=` or a Bearer token.
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: "not configured" });
  }

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const key = req.nextUrl.searchParams.get("key");
    const auth = req.headers.get("authorization");
    if (key !== secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await syncFromIcal();
  return NextResponse.json(result);
}
