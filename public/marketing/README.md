# Marketing assets

QR codes and print pieces for recruiting participants. Everything here is
served publicly at `/marketing/<filename>` (e.g.
`https://eve-research.com/marketing/eve-research-card.png`).

## Tracking

Each QR encodes a `?src=<code>` parameter. When someone scans it and signs up
on `/join`, that code is saved as the person's **source**. Filter the People
database by **Source includes `<code>`** to see/count signups from a given
piece. Because it's a substring match, `src=qr` catches every QR placement,
while `src=qr-flyer` narrows to one.

> Note: only `/join` links attribute a signup's source. Homepage links show up
> in web analytics but the `src` won't reach a person's record unless they land
> on `/join` in the same session.

## Files

| File | Points to | Tracking (`source`) |
| --- | --- | --- |
| `eve-research-join-qr.png` / `.svg` | `/join?src=qr` | `qr` |
| `eve-research-join-qr-flyer.png` / `.svg` | `/join?src=qr-flyer` | `qr-flyer` |
| `eve-research-join-qr-office.png` / `.svg` | `/join?src=qr-office` | `qr-office` |
| `eve-research-home-qr.png` / `.svg` | `/?src=qr` (homepage) | `qr` (visits only) |
| `eve-research-home-qr-logo.png` | `/?src=qr` (homepage), logo in center | `qr` (visits only) |
| `eve-research-card.png` | `/?src=qr` (homepage) | branded card, `qr` |
| `eve-research-business-card-vertical.png` | `/join?src=card` | 2"×3.5" card, `card` |

PNGs are for on-screen / quick print; SVGs are vector for large-format print.
The card and business card are 600 DPI, print-ready (uniform beige to the
edges, so they trim cleanly with or without bleed).

To generate more (e.g. a new placement code), make a QR encoding
`https://eve-research.com/join?src=<your-code>` — codes may use letters,
numbers, hyphens, and underscores.
