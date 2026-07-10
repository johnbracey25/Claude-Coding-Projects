import { NextResponse } from "next/server";
import { isEmailConfigured, isResendConfigured, isSmtpConfigured } from "@/lib/config";
import { sendEmail } from "@/lib/messaging";

export async function GET() {
  const config = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `set (${process.env.RESEND_API_KEY.slice(0, 8)}...)` : "MISSING",
    EMAIL_FROM: process.env.EMAIL_FROM ?? "MISSING",
    isResendConfigured,
    isSmtpConfigured,
    isEmailConfigured,
  };

  const result = await sendEmail({
    to: "johnbracey25@gmail.com",
    subject: "Eve Research test email",
    html: "<p>This is a test email from Eve Research. If you see this, email is working.</p>",
    text: "This is a test email from Eve Research. If you see this, email is working.",
  });

  return NextResponse.json({ config, result });
}
