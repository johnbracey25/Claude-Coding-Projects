/**
 * Central place to read configuration and check whether external services are
 * wired up yet. Lets pages degrade gracefully (show a setup notice) instead of
 * crashing when env vars are missing — important while the project is still
 * being configured by non-technical operators.
 */

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR-PROJECT");

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Email works via Resend (needs a domain) OR Gmail/SMTP (needs an app password).
export const isResendConfigured =
  !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

export const isSmtpConfigured =
  !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

export const isEmailConfigured = isResendConfigured || isSmtpConfigured;

export const isSmsConfigured =
  !!process.env.TWILIO_ACCOUNT_SID &&
  !!process.env.TWILIO_AUTH_TOKEN &&
  !!process.env.TWILIO_FROM_NUMBER;

// Two-way Google Calendar (service account writes bookings onto the calendar).
// Credentials can be supplied either as the whole service-account JSON in
// GOOGLE_SERVICE_ACCOUNT_JSON (easiest — paste the downloaded file), or as
// separate GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.
export const isGoogleCalendarConfigured =
  (!!process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    (!!process.env.GOOGLE_CLIENT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY)) &&
  !!process.env.GOOGLE_CALENDAR_ID;
