"use client";

import { useEffect } from "react";

/**
 * Captures a campaign code from the landing URL (?src=, ?source=, or
 * ?utm_source=) and stashes it for the session, so it survives navigation to
 * the signup form even if the visitor landed on the homepage first. The signup
 * form falls back to this when the code isn't in its own URL.
 */
export default function SourceCapture() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const v = p.get("src") ?? p.get("source") ?? p.get("utm_source");
      if (v && v.trim()) {
        sessionStorage.setItem("er_src", v.trim().slice(0, 60));
      }
    } catch {
      /* sessionStorage/URL unavailable — ignore */
    }
  }, []);
  return null;
}
