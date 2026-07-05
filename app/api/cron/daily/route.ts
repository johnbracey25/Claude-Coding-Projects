import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { syncFromIcal } from "@/lib/calendar-sync";
import { sendDueReminders } from "@/lib/reminders";

/**
 * Daily maintenance run (Vercel Cron — see vercel.json). Refreshes availability
 * from the iCal feed and sends day-before visit reminders. Protected by an
 * optional CRON_SECRET.
 */
export const dynamic = "force-dynamic";

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

  const calendar = await syncFromIcal();
  const reminders = await sendDueReminders();
  return NextResponse.json({ calendar, reminders });
}
