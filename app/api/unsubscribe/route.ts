import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

/**
 * One-click email unsubscribe. Linked from invite emails as
 * /api/unsubscribe?c=<candidate token>. Flips the person's email opt-in off.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("c") ?? "";

  const page = (title: string, msg: string) =>
    new Response(
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>` +
        `<body style="font-family:system-ui;max-width:480px;margin:60px auto;padding:0 20px;text-align:center;color:#0f172a">` +
        `<h1 style="color:#0f766e">Eve Research</h1><p style="color:#475569">${msg}</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );

  if (!isSupabaseConfigured || !token) {
    return page("Unsubscribe", "This link is no longer valid.");
  }

  const supabase = createAdminClient();
  const { data: cand } = await supabase
    .from("candidates")
    .select("person_id")
    .eq("token", token)
    .maybeSingle();

  if (!cand?.person_id) {
    return page("Unsubscribe", "This link is no longer valid.");
  }

  await supabase
    .from("people")
    .update({ email_opt_in: false })
    .eq("id", cand.person_id);

  return page(
    "Unsubscribed",
    "You've been unsubscribed from study emails. You won't receive further emails from us."
  );
}
