# HUD — "The Art of the Possible" Live-Demo App

**Functional spec, v1.** Planner-owned. This document is the contract for what gets
built under `app/hud/**`, `components/hud/**`, `lib/hud/**`. Content is placeholder
throughout; interaction is the product.

---

## 0. Concept in one paragraph

Two browsers join the same room. The **Deck** (presenter's 10" Android tablet,
Chrome, touch) is the instrument. The **Stage** (TV browser, dumb and slow) is the
heads-up display the room watches. The presenter *throws* data cards from the tablet
onto the TV with a flick, *twists* an on-screen dial and the whole board retunes
live, and *pulls things back* into their hand. The audience joins on phones for two
live votes. Transport is Supabase Realtime broadcast — already in the repo, no new
infra. The magic is object permanence across devices: things visibly leave one
screen and arrive on the other, and latency is hidden inside the flight animation.

Naming used throughout: **Room** (session), **Deck** (tablet controller view,
`/hud/deck`), **Stage** (TV HUD view, `/hud/stage`), **Pocket** (audience phone
view, `/hud/pocket`), **Card** (a throwable data object), **Beat** (one scripted
step of the demo), **Scene** (DATA / MEDIA / CREATIVE act).

---

## 1. Gesture vocabulary — the core deliverable

Five gestures. No more. Every one is rehearsable blind, tolerant of sweaty fingers,
and has an unambiguous touch signature so the recognizer never confuses them.

### 1.1 THROW — flick a card onto the Stage

The signature move. Everything else supports it.

- **Touch mechanics.** Cards sit in a tray along the bottom of the Deck. The
  presenter drags a card upward; if release velocity exceeds ~900 px/s with an
  upward component (angle within ±60° of vertical), it's a throw. Below threshold,
  the card rubber-bands home. The horizontal position and angle at release are
  captured as the throw vector.
- **Deck feedback.** The card continues along its momentum, shrinks, and exits the
  top edge in ~250 ms. Vibration API pulse (10 ms) on commit. The tray slot stays
  behind as a dimmed ghost outline — proof the card is "out of your hand."
- **Stage reaction.** The card materializes from the bottom edge of the TV at the
  x-position matching the throw vector, decelerating into its landing slot while
  scaling from 40% → 100% over ~600 ms (transform + opacity only). It arrives as a
  full-screen-legible panel, not a thumbnail.
- **Emergent compare:** throwing a second card while one is on Stage does not need
  a new gesture — the Stage auto-splits into side-by-side compare, first card
  sliding left, new card landing right. Throwing a third replaces the oldest.
- **Why it reads as magic.** The tablet exit animation (250 ms) plus the Stage
  entrance delay is exactly where network latency hides. The audience sees an
  unbroken cause-and-effect: it *left his hand and landed on the wall*. This is the
  Minority Report shot, and it works on a potato of a TV browser because it is one
  translate + one scale.

### 1.2 TUNE — twist a dial, the board retunes

- **Touch mechanics.** Context-dependent dial, ~40% of Deck width, appears when the
  active Stage card exposes a tunable parameter. One-finger circular drag around
  the dial hub (angle-tracked; no two-finger rotate — one finger is more reliable
  standing up). Soft detents every 5% with a 5 ms haptic tick. A long list of tiny
  sliders is exactly what this demo must never look like; one big dial, one
  parameter at a time.
- **Deck feedback.** Needle + numeric readout track the finger with zero smoothing
  (the presenter needs raw truth). Detent ticks give eyes-free confidence.
- **Stage reaction.** Values stream at ≤30 Hz; the Stage interpolates between
  received values with a 120 ms critically-damped ease, so even with jitter the
  motion looks like a physical instrument being tuned, never stepped. What retunes
  is beat-specific: the time scrubber replays 12 weeks of engagement; the budget
  dial reallocates spend mix and the projected-reach ticker counts to its new value.
- **Why it reads as magic.** Continuous, sub-beat-latency cause and effect. A click
  changes a slide; a *twist that the whole wall obeys in real time* proves the
  system is alive. This is the Iron Man moment.

### 1.3 RECALL — grab it back off the wall

- **Touch mechanics.** Swipe *down* from the Deck's upper region (the Stage
  minimap strip) — a decisive single-finger pull, ≥600 px/s downward.
- **Deck feedback.** The recalled card flies down into its tray slot, the ghost
  outline refills, haptic pulse.
- **Stage reaction.** The focused card shrinks toward the bottom edge and exits in
  ~400 ms; the Stage settles back to its ambient state (or to the remaining card
  if in compare).
- **Why it reads as magic.** Symmetry closes the illusion. Throw alone could be a
  trick; throw *and retrieve* establishes a physics. It is also the presenter's
  polite undo — recall beats an "oops, back button" every time.

### 1.4 SPOTLIGHT — press and hold to point at the wall

- **Touch mechanics.** Press-and-hold (>350 ms) anywhere on the Deck's Stage
  minimap, then drag. Lift to extinguish (with a 300 ms fade so brief lifts don't
  flicker).
- **Deck feedback.** A ring appears under the finger on the minimap.
- **Stage reaction.** A soft luminous ring (~15% of screen height) at the mapped
  coordinates; everything outside it dims to 60%. Position streams at ≤30 Hz with
  the same interpolation as TUNE.
- **Why it reads as magic.** It replaces the laser pointer with something that
  looks like telekinesis, and it keeps the audience's eyes exactly where the
  presenter wants them during the data-dense beats. Cheap to build, huge in-room
  value.

### 1.5 ADVANCE — two-finger swipe to change beats

- **Touch mechanics.** Two-finger horizontal swipe anywhere on the Deck: left =
  next beat, right = previous. Two fingers so it can never be confused with a
  drag-to-throw. Also mirrored by giant ◀ ▶ buttons in the Deck footer — the
  boring redundancy that saves the demo when adrenaline ruins fine motor control.
- **Stage reaction.** Scene/beat transition: current content exits (300 ms fade +
  slight drift), new beat's ambient layout enters. Scene changes (DATA → MEDIA →
  CREATIVE) also swap the accent color of the whole Stage, so the room *feels* the
  act change.
- **Why it earns its place.** It's the spine. Every other gesture decorates a beat;
  this one guarantees the presenter can always get to the next one.

**Explicitly cut:** pinch-zoom (fiddly standing up), shake/tilt (banned by
constraints), multi-card drag-ordering (rehearsal risk), on-Deck free-form drawing
(reads badly at 10 ft). Small vocabulary, executed perfectly.

---

## 2. Screen inventory

### 2.1 Stage (TV) states — dark theme, ≥32 px minimum type at 1080p, max ~7 data objects visible

| State | Contents | Notes |
|---|---|---|
| **S0 Lobby** | Giant 4-char room code, QR to `/hud/pocket/{code}`, "waiting" pulse | Also the pre-session hold screen; code stays visible in a corner badge in all later states |
| **S1 Ambient** | Per-scene idle board: DATA = channel constellation (8 channel tiles w/ live-ish sparkline shimmer); MEDIA = spend flow bars; CREATIVE = asset wall of 6 placeholder tiles | What the room sees between throws; never a blank screen |
| **S2 Focus** | One thrown card at full size: title, hero number, one chart, 3 supporting stats | One idea per screen; charts are CSS/SVG bars & lines only |
| **S3 Compare** | Two cards side-by-side + auto-computed delta strip between them | Entered by throwing onto an occupied Stage |
| **S4 Tuning** | Focus/Ambient content + bottom dial readout strip mirroring the Deck dial value | Everything animates from the streamed value |
| **S5 Poll** | Question, 2–4 option bars filling live, vote count ticker, QR + code again | The participation state |
| **S6 Summary** | The "committed plan" board: chosen segment + tuned budget mix + winning creative, composed as one poster | Finale state |
| **S7 Autopilot badge** | Any state + small ⦿ badge; keyboard/remote arrows drive beats | Panic mode, §6 |

Stage renders **no interactive elements** — it is display-only, driven entirely by
events. Degradation rules: transforms + opacity only; no filters/blur/WebGL/canvas
particles; one preloaded woff2 or system font stack; all charts inline SVG.

### 2.2 Deck (tablet) states

| State | Contents |
|---|---|
| **D0 Join** | "Start a room" (mints code) / "Join room" (code entry); presence check-lights for Stage & Pocket count |
| **D1 Conduct** | The main instrument, three zones: **top** = Stage minimap (live thumbnail of Stage layout; spotlight + recall live here), **middle** = context zone (dial when the beat has one; beat title + speaker cue card otherwise), **bottom** = card tray for the current beat (3–5 cards max) + beat progress dots + giant ◀ ▶ |
| **D2 Poll control** | Open/close poll, live tally, "reveal winner" button |
| **D3 Panic drawer** | Edge swipe from right: Resync Stage, Restart beat, Jump-to-beat list, Enable Stage autopilot, End room |

Speaker cue card (D1 middle zone, when no dial): one line of what to say, one line
of what to do next — the presenter's teleprompter, invisible to the room.

### 2.3 Pocket (phone) states

`/hud/pocket/{code}`: P0 waiting ("eyes up 👆" holding screen), P1 vote (2–4 giant
tap targets, one vote per poll, tap = done + confirmation), P2 thanks. Zero chrome,
zero typing beyond nothing (QR carries the code).

---

## 3. Demo choreography — 12 minutes, 8 beats

Accent color shifts per scene: DATA cyan → MEDIA amber → CREATIVE magenta.

| # | Scene | Presenter does | Room sees | The wow |
|---|---|---|---|---|
| 1 | Cold open (1 min) | Walks in, TV shows S0 lobby code. Taps "Start" on Deck, room code matches, Deck breathes | TV wakes: lobby dissolves into the DATA constellation the moment the tablet joins | "The wall just noticed the tablet." Establishes the physics before a word of content |
| 2 | DATA (2 min) | THROWs the **Audience** card | Segment breakdown lands full-screen: 4 synthetic segments, sizes, engagement index | First throw. Pause here; let them ask "do that again" — RECALL it and throw it again. That *is* the demo |
| 3 | DATA (2 min) | TUNE: time-scrub dial, twists through 12 weeks | Every channel's engagement sparkline replays in sync; a "week" readout spins | The whole wall obeying one finger, continuously |
| 4 | DATA (1.5 min) | THROWs **HCP engagement** card onto occupied Stage; SPOTLIGHTs the gap | Auto-compare: patient vs HCP side-by-side, delta strip between | Compare emerged from a throw, not a menu; spotlight = telekinetic pointer |
| 5 | Participation #1 (1.5 min) | Opens poll: "Which segment do we chase?" Phones out | S5: bars race in real time as the room votes; presenter reveals winner, which slides center-stage | The room is *inside* the app. Working session, not keynote |
| 6 | MEDIA (2 min) | THROWs **Budget** card; TUNE: budget-mix dial shifting spend field ↔ digital | Spend bars reflow; projected-reach ticker counts to each new value live | "What if" answered at the speed of a wrist. This is the omnichannel money-shot |
| 7 | CREATIVE (1.5 min) | THROWs **Creative** card; opens poll #2: "Which variant?" | Two placeholder variants side-by-side w/ synthetic performance chips; bars race; winner scales up | Audience picks the creative; the system remembers it |
| 8 | Finale (1 min) | THROWs the **Plan** card | S6 Summary composes itself: their voted segment + his tuned mix + their voted creative assemble into one board — then he RECALLs it into the tablet | "You built this in the last ten minutes, and it just landed in my hand." Close on the object-permanence illusion |

Every beat is self-contained: if one dies, ADVANCE skips it and nothing downstream
breaks (the summary falls back to defaults for any missing choice).

---

## 4. Data model — small, synthetic, JSON-authorable

All static files in `lib/hud/data/*.json`, loaded at build time. No database tables.
Rough total < 30 KB.

```ts
// lib/hud/types.ts
type Channel  = { id: string; name: string; kind: "personal"|"digital"|"media";
                  weeklyEngagement: number[] /* 12 weeks, 0–100 */ };
type Segment  = { id: string; name: string; audience: "hcp"|"patient";
                  size: number; engagementIndex: number;
                  channelAffinity: Record<ChannelId, number> /* 0–1 */ };
type SpendRow = { channelId: string; share: number /* current mix, sums to 1 */;
                  cpm: number /* synthetic, drives reach math */ };
type Creative = { id: string; name: string; variantOf?: string;
                  placeholder: { bg: string; label: string } /* gradient tile, no assets */;
                  metrics: { ctr: number; recall: number; completion: number } };
type Card     = { id: string; sceneId: string; title: string; kind:
                  "segments"|"hcp-engagement"|"budget"|"creative"|"plan"|...;
                  dial?: { id: string; label: string; min: number; max: number;
                           default: number; detent: number } };
type Beat     = { id: string; sceneId: "data"|"media"|"creative";
                  title: string; cue: string /* presenter teleprompter line */;
                  cardIds: string[]; pollId?: string;
                  autopilot: AutopilotStep[] /* scripted actions for §6 */ };
type Poll     = { id: string; question: string;
                  options: { id: string; label: string }[] };
```

Sizing: 8 channels, 4 segments, 12 weeks, 6 creatives (3 concepts × 2 variants),
2 polls, 8 beats. Reach math is a deliberately simple pure function
(`share × budget ÷ cpm`, summed) in `lib/hud/model.ts` — it only has to move
believably when the dial turns, run identically on Deck and Stage, and be
deterministic. Placeholder content rule: names like "Segment A — High-Volume
Writers", gradient tiles for creatives. No real brands, no invented clinical claims.

---

## 5. Architecture

### 5.1 Session & pairing

- **Room code:** 4 chars from a 20-char unambiguous alphabet (no 0/O/1/I/5/S) —
  160 k rooms, trivial to type on a TV remote. Deck mints the code client-side;
  the room *is* the Supabase channel name — no row is written anywhere.
- **Channel:** logical channel `hud:{code}` on the transport (§5.2). In the
  Supabase adapter that is a Realtime broadcast channel (`self: false`,
  `ack: false`) + presence with role meta `{ role: "stage"|"deck"|"pocket" }`.
  The room code, not any URL or key, is the only shared identifier.
- **Stage entry without typing:** `/hud/stage` shows a 4-key code screen with a big
  on-screen keypad navigable by arrow keys — TV remote d-pads emit arrow/Enter key
  events in Tizen and Fire TV browsers, so the code is enterable with the remote
  alone. Direct URL `/hud/stage/{code}` for the laptop fallback.
- **Auth: none.** Anon key only. Rooms are ephemeral, obscure, and content is
  synthetic — acceptable exposure. No service-role anywhere near `/hud`.

### 5.2 Transport seam

Plain hygiene: channel plumbing stays out of UI code. All state and UI code talks
to one narrow, typed interface in `lib/hud/transport.ts`; the Supabase Realtime
implementation lives behind it in one file. This also keeps the event contract in
one place instead of scattered through components.

```ts
// lib/hud/transport.ts — the ONLY file that knows what the wire is
export type Role = "deck" | "stage" | "pocket";

export type HudEvent =
  | { t: "beat:set";     p: { beatId: string } }
  | { t: "card:throw";   p: { cardId: string; vx: number; vy: number; xNorm: number } }
  | { t: "card:recall";  p: { cardId: string } }
  | { t: "tune";         p: { dialId: string; value: number } }
  | { t: "tune:commit";  p: { dialId: string; value: number } }
  | { t: "spot";         p: { x: number; y: number; on: boolean } }
  | { t: "poll:open";    p: { pollId: string } }
  | { t: "poll:close";   p: { pollId: string } }
  | { t: "poll:reveal";  p: { pollId: string } }
  | { t: "poll:vote";    p: { pollId: string; optionId: string; voterId: string } }
  | { t: "poll:tally";   p: { pollId: string; counts: Record<string, number> } }
  | { t: "sync:req";     p: {} }
  | { t: "sync:state";   p: RoomState };

export type Envelope = HudEvent & { seq: number; from: Role };

export type ConnState = "connecting" | "open" | "reconnecting" | "closed";

export interface HudTransport {
  connect(roomCode: string, role: Role): Promise<void>;
  send(event: HudEvent): void;                      // fire-and-forget; transport stamps seq/from
  subscribe(handler: (e: Envelope) => void): () => void;
  onStatus(handler: (s: ConnState) => void): () => void;
  disconnect(): void;
}
```

The implementation (`lib/hud/transport-supabase.ts`, Realtime broadcast +
presence) is the only file that imports `@supabase/supabase-js` in the hud
namespace. The event contract above is the wire protocol, serialized as JSON.

### 5.3 Realtime message contract semantics

`seq` is a monotonic per-sender counter stamped by the adapter; receivers drop
stale `seq` per event type (critical for `tune`/`spot` streams).

| Event `t` | Payload `p` | Notes |
|---|---|---|
| `beat:set` | `{ beatId }` | ADVANCE / jump-to-beat |
| `card:throw` | `{ cardId, vx, vy, xNorm }` | throw vector; Stage derives entry x + timing |
| `card:recall` | `{ cardId }` | |
| `tune` | `{ dialId, value }` | throttled ≤30 Hz, coalesced (send latest only) |
| `tune:commit` | `{ dialId, value }` | on finger-lift; authoritative final value |
| `spot` | `{ x, y, on }` | normalized 0–1 coords, ≤30 Hz |
| `poll:open` / `poll:close` / `poll:reveal` | `{ pollId }` | |
| `poll:vote` | `{ pollId, optionId, voterId }` | voterId = random localStorage id; Deck tallies (dedupes) and rebroadcasts `poll:tally { counts }` so Stage never trusts phones directly |
| `sync:req` | `{}` | sent by Stage on join/reconnect |
| `sync:state` | full `RoomState` snapshot | see below |

**Authority model:** the Deck holds the single authoritative `RoomState`
(`{ beatId, stageCards[], dialValues{}, poll{ id,status,counts }, spotlight }`),
persisted to `localStorage` on every change. The Stage is a pure `render(state)` +
transition-animator. Deck emits `sync:state` on any `sync:req` **and as a 5 s
heartbeat**. Stage applies snapshots idempotently (diff against current, animate
only real changes) — so a missed message self-heals within one heartbeat, silently.

### 5.4 Latency strategy

- Broadcast RTT on conference wifi: expect 100–300 ms. **Hide it in choreography:**
  every discrete action has a Deck-side exit animation (~250 ms) before the
  Stage-side entrance is even expected; total flight reads as intentional physics.
- Continuous streams (`tune`, `spot`): send-side coalescing to latest value at
  30 Hz; receive-side 120 ms interpolation. Jitter becomes smoothness, not stutter.
- Stage runs a single rAF loop easing all animatable values toward targets —
  cheap enough for a Tizen browser, and it makes every update look continuous.

### 5.5 Reconnect behavior (the network *will* hiccup)

- Supabase client auto-reconnects with backoff; both ends also watch heartbeat
  freshness. Stage missing 2 heartbeats (>10 s): show a 12 px dim ⟳ glyph in a
  corner — **never a modal, never a blank screen**; current content keeps
  displaying. On rejoin: `sync:req` → snapshot → diff-animate. To the audience a
  15 s outage looks like the presenter paused on a slide.
- Deck disconnect: banner on the Deck only ("reconnecting — Stage is holding"),
  gestures queue-disabled except ADVANCE, which buffers one step.
- Either device can be hard-killed and rejoin the same code cold: Deck restores
  state from localStorage; Stage restores from the next snapshot. Rehearse this.

### 5.6 Repo integration, portability rules & lift-out procedure

The demo is built on a personal repo/Vercel/Supabase but deploys for the client
on a work environment that may share none of that. These rules are binding:

- **Strict containment.** All demo code lives in `app/hud/**`, `components/hud/**`,
  `lib/hud/**` (incl. `lib/hud/data/*.json`). No imports from the Eve Research
  app's `lib/*` (not `lib/supabase/*`, not `lib/config.ts`, not `lib/types.ts`)
  — `lib/hud` re-declares the two lines of Supabase client creation inside its
  own adapter. The only files outside the namespace that change at all:
  `lib/supabase/middleware.ts` (add `"/hud"` to `PUBLIC_PREFIXES` — **found
  blocker:** without it the middleware bounces the TV to `/login`) and
  `app/sitemap.ts` (exclude `/hud`).
- **Zero database.** Confirmed viable: no tables read or written, no migrations.
  Synthetic data ships as static JSON in the repo; room state lives in the
  realtime channel + Deck memory + Deck localStorage; polls tally in Deck memory.
  The channel name is the room — nothing to provision, nothing to clean up.
- **Zero hardcoded project identity.** All environment via three vars, read only
  inside adapters: `NEXT_PUBLIC_HUD_TRANSPORT` (`supabase` default),
  `NEXT_PUBLIC_HUD_SUPABASE_URL`, `NEXT_PUBLIC_HUD_SUPABASE_ANON_KEY`. On the
  personal deploy these are set to the same values as the app's existing vars,
  but the demo never reads the app's vars directly — so the work deploy needs no
  archaeology. QR/join URLs are derived from `window.location.origin`, never
  from config.
- **Zero new dependencies.** Gestures are hand-rolled pointer-event math (~150
  lines); charts are inline SVG. `@supabase/supabase-js` is only referenced by
  the one adapter file, so a work deploy that swaps transports can drop it.
- Personal-deploy setup note: verify **Realtime is enabled** on the Supabase
  project (unused by the existing app, so assume unverified). Default rate
  limits (≥100 msgs/s/channel) exceed our worst case (~60/s during a poll).

**Lift-out procedure (work deployment):** (1) `create-next-app` (or work's
standard Next.js 14+ App Router skeleton) with Tailwind; (2) copy `app/hud`,
`components/hud`, `lib/hud` verbatim; (3) ensure no auth middleware blocks
`/hud` (in a fresh app there is none); (4) either set the two Supabase env vars
against any Supabase project, or write `lib/hud/transport-<x>.ts` implementing
`HudTransport` for the corporate-approved pub/sub and set
`NEXT_PUBLIC_HUD_TRANSPORT=<x>`; (5) deploy, open `/hud/stage` on the TV. Steps
1–3 are mechanical; step 4 is the only engineering, and it is one file.

---

## 6. Failure modes & the panic plan

| Failure | Likelihood | Escape hatch |
|---|---|---|
| TV built-in browser too old / broken | High | Priority order rehearsed in advance: laptop + venue wireless-share → Fire TV stick browser → Tizen browser. Stage must pass a 5-min soak test on the actual venue TV the morning of |
| Venue wifi captive portal / client isolation | High | Both devices on the presenter's phone hotspot. Traffic is device↔cloud (internet), never device↔device, so isolation is survivable as long as each device gets out |
| Corporate network blocks websocket upgrades / odd ports (work deployment) | Medium–High | Everything runs on 443; but wss upgrades specifically can be killed by proxies. The transport seam (§5.2) exists for this: prefer an adapter with automatic HTTPS long-poll/SSE fallback (Ably/Pusher) or the self-hosted SSE+POST adapter, both plain HTTPS. Test on the actual work network before the session; hotspot remains the last resort |
| Tablet dies / freezes mid-demo | Medium | **Stage Autopilot:** press `A` (or via `?autopilot=1`) on the Stage — remote/keyboard arrows now ADVANCE beats, and each beat plays its scripted `autopilot` steps (auto-throws, a canned dial sweep, canned poll results). The demo finishes from the TV remote alone. Presenter narrates; nobody knows |
| Supabase/Realtime outage | Low | Autopilot needs no network: beats + data are bundled in the page. The interactive demo degrades to a beautiful scripted one |
| Poll flops (audience won't phone-in) | Medium | Deck poll screen has a "seed votes" button trickling in synthetic votes; presenter votes too; `poll:reveal` works at any tally |
| Wrong gesture fires live | Medium | RECALL is the universal undo; Panic drawer "Restart beat" resets one beat's state without touching the arc |
| Projector instead of TV, weird resolution | Medium | Stage layout scales from a single root `font-size: clamp()`; test at 720p. No layout may depend on exact px |
| Latency spikes to seconds | Low | Discrete actions still land (late but animated); presenter patter covers. Streams self-heal via coalescing. Heartbeat resync guarantees convergence |

**Golden rule baked into every Stage state: the TV never shows an error, a spinner
overlay, or a blank screen while the room is watching.** Worst case it holds the
last good frame with a tiny glyph.

---

## 7. Build order — cut list

**M1 — the spine (build first; demoable end of M1)**
1. Route scaffolding + add `/hud` to middleware `PUBLIC_PREFIXES`
2. Room join: Deck mints code, Stage keypad entry (arrow-key navigable), presence
3. `HudTransport` interface + Supabase adapter behind it (§5.2); envelope, seq
   handling, heartbeat `sync:state`, `sync:req`. The seam is M1, not a refactor —
   retrofitting it later is exactly the churn the work migration can't afford
4. Beat engine + ADVANCE (two-finger swipe + buttons) + Stage scene transitions
5. THROW (recognizer, Deck exit anim, Stage landing, auto-compare) + RECALL
6. Synthetic dataset + the 8 beats' Stage layouts (S1/S2/S3/S6), ugly-but-legible

*With M1 alone the demo already works: throw, recall, compare, advance.*

**M2 — the instrument**
7. TUNE dial (recognizer, detents/haptics, stream + interpolation) wired to the
   time-scrub and budget-mix beats, incl. reach math
8. SPOTLIGHT + Stage minimap
9. Reconnect hardening: localStorage state, idempotent snapshot diffing, kill-test

**M3 — the room**
10. Pocket + polls (QR on Stage, vote dedupe/tally on Deck, racing bars, seed-votes)
11. Stage Autopilot (scripted beat steps, keyboard/remote driving)
12. Panic drawer (resync / restart beat / jump / autopilot toggle / end)

**M4 — polish (nice-to-have, cut freely)**
13. Type/color/motion pass: scene accent colors, easing curves, lobby pulse
14. Deck speaker cue cards; beat progress dots refinement
15. Tizen/Fire TV soak-test fixes; 720p pass

Explicitly **not** in any milestone: sound (TV browser autoplay is a trap),
multi-presenter rooms, persistence of results, real content, WebGL anything.

---

## 8. Open decisions intentionally made (do not reopen)

- Deck-authoritative state over CRDTs/DB: one writer, ephemeral room — simplest
  thing that survives reconnects.
- No DB rows at all: the channel name is the room. Nothing to migrate, nothing to
  clean up, nothing to leak.
- Hand-rolled gestures over a library: five gestures, exact thresholds, no deps.
- Polls tallied on the Deck, not on phones or Stage: single source of truth,
  dedupe in one place, Stage stays a dumb renderer.
