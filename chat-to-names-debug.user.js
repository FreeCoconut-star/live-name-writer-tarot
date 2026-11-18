// ==UserScript==
// @name         YouTube Chat -> Name Writer relay (DEBUG)
// @match        https://www.youtube.com/live_chat*
// @match        https://studio.youtube.com/live_chat*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  const RELAY = 'http://127.0.0.1:8787/msg';
  const LOG = (...a) => console.log('[name-writer]', ...a);
  // true = paid (Super Chat / Super Sticker), false = normal message
  const TAGS = {
    'yt-live-chat-text-message-renderer': false,
    'yt-live-chat-paid-message-renderer': true,
    'yt-live-chat-paid-sticker-renderer': true
  };
  const seen = new Set();
  let started = false;

  function send(author, text, paid) {
    LOG('sending to relay:', author, '|', text, '| paid:', paid);
    GM_xmlhttpRequest({
      method: 'POST', url: RELAY, data: JSON.stringify({ author, text, paid }),
      headers: { 'Content-Type': 'application/json' },
      onload: r => LOG('relay answered', r.status, r.responseText),
      onerror: e => LOG('SEND FAILED (relay not reachable or blocked):', JSON.stringify(e)),
      ontimeout: () => LOG('SEND TIMED OUT')
    });
  }

  function handle(node, initial) {
    const tag = node.tagName && node.tagName.toLowerCase();
    if (!(tag in TAGS)) return;
    const id = node.id || '';
    if (id) {
      if (seen.has(id)) return;
      seen.add(id);
      if (seen.size > 500) seen.delete(seen.values().next().value);
    }
    if (initial) return;           // ignore messages already on screen
    const paid = TAGS[tag];
    const author = node.querySelector('#author-name')?.textContent.trim();
    const text = node.querySelector('#message')?.textContent.trim() || '';
    LOG('new chat row:', tag, '| author:', author, '| text:', text);
    if (author && (text || paid)) send(author, text, paid);
    else LOG('row skipped: could not read author/text (YouTube page layout may have changed)');
  }

  const sel = Object.keys(TAGS).join(',');
  LOG('script started on', location.href);
  const timer = setInterval(() => {
    const items = document.querySelector('yt-live-chat-item-list-renderer #items');
    if (!items || started) return;
    started = true; clearInterval(timer);
    items.querySelectorAll(sel).forEach(n => handle(n, true));
    new MutationObserver(muts => {
      for (const m of muts) m.addedNodes.forEach(n => handle(n, false));
    }).observe(items, { childList: true });
    LOG('watching chat');
  }, 1000);
})();
