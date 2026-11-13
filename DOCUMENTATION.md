# Live Name Writer + Tarot — Documentation

Source of truth for architecture, settings and how to add features. If code and this file disagree, the code wins and this file gets fixed.

## What it does
Viewers type a name in YouTube live chat. A vertical (1080x1920) Phaser 3 page writes the name in glowing cursive, deals three tarot cards from a shuffled deck, flips them, shows a short reading, then moves to the next name. Optional mode: only Super Chat / Super Sticker payers get readings, and they jump the queue.

## Files
| File | Role |
|---|---|
| `chat-to-names.user.js` | Tampermonkey userscript. Runs inside YouTube's popout chat page, reads new chat messages, POSTs them to the relay. |
| `relay.js` | Tiny local Node server (no npm installs). Receives POSTs on `/msg`, broadcasts to the page on `/events` (server-sent events). Listens on `127.0.0.1:8787` only. |
| `name-writer.html` | The visual page (Phaser 3 from cdnjs, fonts from Google Fonts). Single file, no build step. |

Flow: `YouTube popout chat -> userscript -> relay.js -> name-writer.html`
Optional, off by default: the page can instead poll the YouTube Data API (needs video ID + API key; uses quota).

## How to run
1. Install Node.js (nodejs.org) once.
2. In the project folder run `node relay.js` (leave the window open).
3. Install the userscript in Tampermonkey (file must end in `.user.js`).
4. Open the stream's popout chat: `https://www.youtube.com/live_chat?is_popout=1&v=VIDEO_ID`
5. Open `name-writer.html` in a browser (or as an OBS browser source, 1080x1920).
6. Test privately first: type `!name Alex` in your own chat.

## Message format (userscript -> relay -> page)
`{ "author": string (max 60), "text": string (max 200), "paid": boolean }`
Changing it means updating all three files together.

## Chat rules (in `handleChat` / `enqueue`)
- `!name X` or `!write X` (X up to 24 chars) queues X.
- Mode `any`: every chatter's display name is queued. Paid messages always queue the author name if no command is given.
- "Super Chat only" checkbox ignores unpaid messages.
- Name cleaning: leading `@` removed, whitespace collapsed, cut to 24 characters.
- Free users: 1 reading per person per 2 minutes. Paid: no limit, and they jump ahead of free items.

## Settings
| Setting | Panel control | URL parameter |
|---|---|---|
| Hide panel (for OBS) | — | `clean=1` |
| Live video ID (API mode) | Live video ID | `video=ID` |
| API key (API mode) | YouTube API key | `key=KEY` (avoid; ends up in history) |
| Name source | Chat command / Every chatter | `mode=cmd` or `mode=any` |
| Super Chat only | checkbox | `paid=1` |
| Relay address | — | `relay=http://127.0.0.1:8787/events` |

Example for OBS: `name-writer.html?clean=1&mode=cmd&paid=0`

## Constants (top of the script in `name-writer.html`)
`W,H = 1080,1920` canvas · `HOLD_MS = 9000` reading display time · `CW,CH = 250,400` card size · `CY = 1190`, `CX = [200,540,880]` card row · `DECK = [540,1190]` deck position · name-write duration = 380 ms per letter, min 1.8 s, max 6 s · free cooldown 120000 ms.

## Content
22 Major Arcana entries in `CARDS` as `[name, emoji, meaning]`; 4 closing lines in `CLOSERS`. No copyrighted card art: cards are drawn from shapes and emoji.

## Security and safety
- Chat text is untrusted. It is length-limited (relay 60/200 chars, page 24) and drawn as Phaser canvas text, never inserted as HTML.
- The relay only listens on this computer (`127.0.0.1`). It allows any web page to read it (`Access-Control-Allow-Origin: *`), which is fine locally.
- The API key, if used, is saved in the browser's localStorage on your machine, never in this repository.
- For big audiences, add a word filter or moderation (see roadmap).

## Fragile parts
- The userscript depends on YouTube's internal page tags (`yt-live-chat-text-message-renderer`, `#author-name`, `#message`, `yt-live-chat-item-list-renderer #items`). YouTube can change these without notice; if names stop appearing, check here first. Always run a private test stream before going live.
- Page needs internet for Phaser and fonts.

## Known limitations (found while documenting; not yet changed)
- The waiting queue has no maximum size; a flood of chat could grow it and the 2-minute memory of who already played.
- No profanity or word filtering on names.
- Per-reading objects (text, cards, mask, pen) are destroyed after each reading; background particle emitters live for the whole session by design.

## Feature recipes
- **New card/reading text:** edit `CARDS` / `CLOSERS`.
- **Change reading time:** edit `HOLD_MS`.
- **New setting:** add a panel control in `#ui`, read it in `handleChat`/`enqueue`, AND add a URL parameter near the top (panel is hidden with `clean=1`).
- **Change message format:** update userscript `send`, relay `/msg` handler, and page `handleChat` caller together.
- **Different chat command:** edit the regex in `handleChat`.

## Roadmap (ideas, not started)
Word filter / blocklist · queue size cap · sound effects · reading history screen · more card sets.

## Version control
Repository: private GitHub repo `live-name-writer-tarot`. One commit per change, with a clear message. Do not edit files in two places; GitHub is the master copy.

## Changelog
- **2026-11-13** — Project moved to GitHub. Added this documentation file and `.gitignore`. Userscript file named `chat-to-names.user.js` (the project copy was `chat-to-names_user.js`; Tampermonkey needs `.user.js`). No code changes.
