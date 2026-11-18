# Game Contract — how a game plugs into the relay

> Describes what is **built today (§1–§3)**, what a new game must follow (§3), what is **planned, not built (§4–§5)**. Do not describe planned items as working.

## 1. What the relay does today (`relay.js`, port 8787, 127.0.0.1 only)
| Address | Purpose |
|---|---|
| `GET /events` | Server-sent events. **Unnamed events** = chat messages `{author,text,paid}`. **Named event `settings`** = the saved control-panel settings (JSON object). A keep-alive ping every 15 s. |
| `POST /msg` | The userscript sends chat messages here (≤ 5000 bytes). |
| `POST /settings` | The control panel sends its settings (≤ 60 KB); the relay saves `settings.json` and broadcasts them. |
| `GET /test?name=Alex[&paid=1]` | Sends `!name Alex` to every open page (a way to test without YouTube). |
| `GET /` | Serves **only** `name-writer.html`. Other games must be opened another way until the relay serves several games (§4). |

Games that ignore the named `settings` event are not affected by it.

## 2. Message format
`{ "author": string(≤60), "text": string(≤200), "paid": boolean }` — `paid` is true only for Super Chat / Super Sticker.

## 3. What every game must do (contract v1)
1. **One HTML file**, Phaser 3 from cdnjs, no build step, no copyrighted art.
2. **Listen** to `EventSource(<relay>/events)`. The relay address is the page's own origin when served from the relay; otherwise `http://127.0.0.1:8787`; the URL parameter `relay=` overrides it. Read chat from unnamed events only.
3. **Treat chat as untrusted:** keep the length limits, draw text on the canvas, never insert it as HTML.
4. **`clean=1`** hides all controls (used in OBS).
5. **Settings:** every setting has a panel control, a tooltip and a URL parameter; priority is URL > live from relay > saved in browser > default; save only differences from defaults.
6. **Queue basics:** one entry per chatter while waiting, a cooldown per chatter, Super Chat / Super Sticker (`paid`) goes first, a cap on waiting entries.
7. **Memory:** destroy everything created per round.
8. **Test path:** the game works with `GET /test` (or an equivalent button) without YouTube.
9. **Documentation:** a doc file for the game (what it does, settings table, constants, risks, changelog) and a line in `PROJECT.md` §3.

The Name Writer page is the reference implementation: its settings panel (tabs, tooltips, URL parameters, live sync) is built from a list of setting definitions (`DEFS`) and can be copied as a starting point.

## 4. Known limitation: one shared settings file
The relay keeps **one** settings object for all pages. If two different games both use the control-panel sync, they would overwrite each other's settings. **Planned fix (not built):** settings keyed by game (`POST /settings?game=<id>`, `settings.<id>.json`, and the `settings` event carrying the game id; each page applies only its own).

## 5. Proposed layout for several games (not done; needs the owner's OK)
```
PROJECT.md                     master project file
GAME-CONTRACT.md               this file
CHANGELOG.md                   one project-wide changelog
shared/relay.js                the relay (would serve every game)
shared/chat-to-names.user.js   the userscript
shared/start-windows.bat
games/name-writer/index.html + DOCUMENTATION.md
games/horse-race/index.html   + DOCUMENTATION.md
```
The relay would serve each game at `/<game-id>/`, plus a simple menu page at `/`. In OBS the Browser Source URL would be, for example, `http://127.0.0.1:8787/horse-race/?clean=1`: the game picked per stream = the URL chosen in OBS.

## 6. Adding a game — checklist
1. Read `PROJECT.md` and this file.
2. Build the game to §3; reuse the Name Writer panel and settings code.
3. Test it with `/test` and with simulated chat; syntax-check.
4. Write the game's doc; update `PROJECT.md` §3 and the changelog.
5. Owner approves, then push to GitHub; read it back to confirm.
