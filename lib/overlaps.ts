/**
 * Availability overlap engine. Given each connected calendar's availability
 * blocks, find the time windows where multiple calendars are free at once — so
 * staff can spot "everyone's open" slots (e.g. 3/3) and near-misses (2/3).
 */

export interface AvailInterval {
  feedId: string;
  feedName: string;
  start: number; // epoch ms
  end: number; // epoch ms
}

export interface OverlapSlot {
  start: number;
  end: number;
  feedIds: string[];
  feedNames: string[];
  count: number;
}

function sameMembers(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/**
 * Compute maximal segments during which a fixed set of calendars is
 * simultaneously available. Each returned slot's `count` is the exact number of
 * distinct calendars free during it.
 */
export function computeOverlaps(
  intervals: AvailInterval[],
  opts?: { minMinutes?: number }
): OverlapSlot[] {
  const minMs = (opts?.minMinutes ?? 30) * 60_000;

  // 1. Merge overlapping intervals within each feed so a feed counts once.
  const byFeed = new Map<string, AvailInterval[]>();
  const nameById = new Map<string, string>();
  for (const iv of intervals) {
    if (iv.end <= iv.start) continue;
    nameById.set(iv.feedId, iv.feedName);
    const list = byFeed.get(iv.feedId);
    if (list) list.push(iv);
    else byFeed.set(iv.feedId, [iv]);
  }

  const merged: AvailInterval[] = [];
  for (const [feedId, list] of byFeed) {
    list.sort((a, b) => a.start - b.start);
    let cur = { ...list[0], feedId };
    for (let i = 1; i < list.length; i++) {
      const nx = list[i];
      if (nx.start <= cur.end) {
        cur.end = Math.max(cur.end, nx.end);
      } else {
        merged.push(cur);
        cur = { ...nx, feedId };
      }
    }
    merged.push(cur);
  }

  if (merged.length === 0) return [];

  // 2. Sweep across all boundary points.
  const points = new Set<number>();
  for (const iv of merged) {
    points.add(iv.start);
    points.add(iv.end);
  }
  const sorted = [...points].sort((a, b) => a - b);

  // 3. For each elementary segment, find which feeds are active.
  const raw: OverlapSlot[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const s = sorted[i];
    const e = sorted[i + 1];
    if (e <= s) continue;
    const mid = (s + e) / 2;
    const feedIds = merged
      .filter((iv) => iv.start <= mid && mid < iv.end)
      .map((iv) => iv.feedId);
    const distinct = [...new Set(feedIds)];
    if (distinct.length === 0) continue;
    raw.push({
      start: s,
      end: e,
      feedIds: distinct,
      feedNames: distinct.map((id) => nameById.get(id) ?? "Unknown"),
      count: distinct.length,
    });
  }

  // 4. Merge adjacent segments with the identical feed set.
  const out: OverlapSlot[] = [];
  for (const seg of raw) {
    const last = out[out.length - 1];
    if (last && last.end === seg.start && sameMembers(last.feedIds, seg.feedIds)) {
      last.end = seg.end;
    } else {
      out.push({ ...seg });
    }
  }

  // 5. Drop slivers.
  return out.filter((s) => s.end - s.start >= minMs);
}
