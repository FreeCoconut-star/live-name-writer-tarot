# Live Chat Games — Master Project File

> **Every chat must read this file first.** GitHub (`FreeCoconut-star/live-name-writer-tarot`, branch `main`) is the master copy. A chat's memory, other chats, and the files stored in the Claude project can be out of date. If anything disagrees with GitHub, GitHub wins and the disagreement is reported to the owner.
> Last updated: 2026-11-18

## 1. What this project is
Interactive Phaser 3 games for YouTube Shorts live streams (vertical 1080×1920, shown in OBS). Viewers play by typing in live chat. Several games will exist; the owner picks one per stream. **All games share the same chat plumbing**, so each game is a small module on top of it.

```
YouTube popout chat → Tampermonkey userscript → relay.js (local, 127.0.0.1:8787) → a game page (Phaser, in browser / OBS)
```

## 2. The owner
A CEO, not a technical person. Plain language, no jargon (or define it in a few words), copy-paste steps, short replies. When a decision is needed: a recommendation plus one-line reasons.

## 3. Games
| Game | Status | Where | Doc |
|---|---|---|---|
| Name Writer + Tarot | Working; tested live | `name-writer.html` (repo copy is the **old 2026-11-13 import**; the current version is newer) | `DOCUMENTATION.md` |
| Horse Race | Owner says it exists (built in other chats). **Not found in GitHub** when checked on 2026-11-18 (the account has 4 repositories, none with it). Its files have not been seen by the chat that wrote this file. | unknown | none yet |
| (future games) | — | — | — |

Update this table whenever a game is added, moved or changes status.

## 4. Shared parts — do not copy or fork
| Part | Rule |
|---|---|
| `relay.js` | One relay for all games. Zero npm dependencies. Local only. |
| `chat-to-names.user.js` | One userscript for all games. Matches `www.youtube.com/live_chat*` and `studio.youtube.com/live_chat*`. |
| Message format | `{ "author": string(≤60), "text": string(≤200), "paid": boolean }`. Changing it means updating the userscript, the relay and **every** game together. |
| Game contract | `GAME-CONTRACT.md` — what every game must do and how to add one. |

A change to a shared part needs: say which games it affects, test them all, update `GAME-CONTRACT.md`, and record it in the changelog.

## 5. Rules for every chat
**At the start**
1. Make sure the GitHub connector is on. If it is not, or GitHub cannot be read, say so plainly.
2. Read this file, then the documentation of the game being worked on.
3. If the owner uploaded a file, or the project's stored files, differ from GitHub: say so and ask which is newer **before** changing anything.
4. Restate the request in one sentence and name the files that will change.

**While working**
- Smallest change that works. Deliver COMPLETE files, not snippets.
- Syntax-check changed JavaScript (`node --check`) and test what can be tested. Say plainly what was tested, what was only reviewed, and what could not be checked.
- Single HTML file per game, no build step, local files only, no copyrighted art (shapes and emoji).
- Chat text is untrusted: keep length limits, draw as canvas text, never insert as HTML.
- Destroy everything created per round; no leaks.
- Every new setting gets a panel control, a tooltip **and** a URL parameter (the panel is hidden in OBS).
- Warn about fragile parts (YouTube page selectors) and recommend a private test stream before going live.

**At the end of every change**
1. Update the game's documentation and the changelog (and this file if the project changed).
2. Tell the owner in 2–3 plain sentences: what changed, what to replace or restart, how to test.
3. Push to GitHub only after the owner says OK. Read the current file version first (never overwrite newer work), push, then read it back to confirm. Never claim "pushed" unless a tool result confirms it.

## 6. Decisions made
- GitHub is the master copy; project knowledge files are snapshots and can be stale.
- One shared relay and one shared userscript for all games; games are modules.
- Settings: panel + URL parameter + saved in browser; live sync to OBS through the relay (Name Writer today).
- Name Writer default mode is "every chatter's display name"; a "type your name" mode exists (2026-11-18).
- Delay investigation (comment → visible on stream) is **parked**. A tested "delay version" is saved separately (`parked-delay-version/`) and is not part of the main line.

## 7. Open items
- Locate Horse Race and the other games and bring them into the repo.
- Repository visibility: the repo is **public** but its documentation said private. Owner to decide.
- Repository layout and name for several games (proposal in `GAME-CONTRACT.md` §5).
- Per-game settings in the relay (needed before two games use the control panel; see `GAME-CONTRACT.md` §4).
- No name filter / blocklist yet; Mac launcher; API-only mode.

## 8. Known risks
- YouTube can change its chat page and silently break the userscript. Test privately before each live.
- The relay accepts messages and settings from any web page open in the same browser (no token). Moderate big streams.
- Tests so far used a stand-in for Phaser; the real animation, fonts and OBS were checked only by the owner by eye.
