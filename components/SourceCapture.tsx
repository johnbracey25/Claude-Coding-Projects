"use client";

import { useEffect } from "react";

/**
 * Captures where a visitor came from, so signups get attributed even when the
 * campaign code isn't on the form's own URL.
 *
 * Priority (highest first):
 *   1. An explicit code in the landing URL (?src / ?source / ?utm_source)
 *   2. A source derived from the HTTP referrer (facebook, google, etc.)
 *
 * Both are stashed in sessionStorage; the signup form reads them as fallbacks.
 */

const REFERRER_MAP: [RegExp, string][] = [
  [/(^|\.)facebook\.com$/, "facebook"],
  [/(^|\.)fb\.(com|me)$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)nextdoor\.com$/, "nextdoor"],
  [/(^|\.)google\./, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)youtube\.com$/, "youtube"],
  [/(^|\.)t\.co$/, "twitter"],
  [/(^|\.)(twitter|x)\.com$/, "twitter"],
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)lnkd\.in$/, "linkedin"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
];

function sourceFromReferrer(ref: string): string | null {
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (!host || host.endsWith("eve-research.com")) return null; // internal/direct
    for (const [re, name] of REFERRER_MAP) if (re.test(host)) return name;
    // Unknown external site: keep the bare domain (dots → dashes for the
    // source format), prefixed so staff can tell it came from a referrer.
    const bare = host.replace(/^www\./, "");
    const token = ("ref-" + bare).replace(/[^a-z0-9_-]/g, "-").slice(0, 40);
    return token.replace(/-+$/, "") || null;
  } catch {
    return null;
  }
}

export default function SourceCapture() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const explicit = p.get("src") ?? p.get("source") ?? p.get("utm_source");
      if (explicit && explicit.trim()) {
        sessionStorage.setItem("er_src", explicit.trim().slice(0, 60));
        return; // an explicit code always wins over the referrer
      }
      // No explicit code on this landing — derive one from the referrer, but
      // don't clobber a real code captured earlier this session.
      if (!sessionStorage.getItem("er_src")) {
        const derived = document.referrer
          ? sourceFromReferrer(document.referrer)
          : null;
        if (derived) sessionStorage.setItem("er_src_ref", derived);
      }
    } catch {
      /* sessionStorage/URL unavailable — ignore */
    }
  }, []);
  return null;
}
