/**
 * Fire a TikTok Pixel event (no-op if the pixel isn't loaded). Used for
 * conversion tracking so TikTok ad campaigns can optimize toward signups.
 */
interface Ttq {
  track: (event: string, params?: Record<string, unknown>) => void;
  identify: (params: Record<string, unknown>) => void;
}

export function ttqTrack(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const ttq = (window as unknown as { ttq?: Ttq }).ttq;
  try {
    ttq?.track(event, params);
  } catch {
    /* pixel not ready — ignore */
  }
}
