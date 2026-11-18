// Run: node relay.js   (no npm install needed)
// Does three things:
//  1. Serves the page at http://127.0.0.1:8787/  (use this address in your browser AND in OBS)
//  2. Userscript POSTs chat messages to /msg; the page listens on /events (server-sent events).
//  3. One-click test: http://127.0.0.1:8787/test?name=Alex  (add &paid=1 to test a Super Chat)
//  4. Remembers the control-panel settings (settings.json next to this file) and sends every change live to all open copies of the page (OBS).
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = 8787, PAGE = path.join(__dirname, 'name-writer.html');
const clients = new Set();

// ---- control-panel settings, shared live with every open page ----
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
function cleanSettings(o) {
  const r = {};
  if (!o || typeof o !== 'object' || Array.isArray(o)) return r;
  for (const k of Object.keys(o).slice(0, 100)) {
    const v = o[k];
    if (!/^[a-z0-9_]{1,30}$/i.test(k)) continue;
    if (typeof v === 'string') r[k] = v.slice(0, 8000);
    else if (typeof v === 'number' && Number.isFinite(v)) r[k] = v;
    else if (typeof v === 'boolean') r[k] = v;
  }
  return r;
}
let shared = {};
try { shared = cleanSettings(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))); } catch (e) {}
const settingsEvent = () => `event: settings\ndata: ${JSON.stringify(shared)}\n\n`;
function readBody(req, limit, done) {
  let body = '';
  req.on('data', c => { body += c; if (body.length > limit) req.destroy(); });
  req.on('end', () => done(body));
}

function broadcast(m) {
  const line = JSON.stringify({ author: String(m.author || '').slice(0, 60), text: String(m.text || '').slice(0, 200), paid: !!m.paid });
  console.log(line);
  for (const c of clients) c.write(`data: ${line}\n\n`);
}

// keeps the connection alive through OBS / browsers / sleepy networks
setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 15000);

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.end();
  let u;
  try { u = new URL(req.url, 'http://127.0.0.1'); } catch (e) { res.statusCode = 400; return res.end('bad'); }

  if (req.method === 'GET' && u.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
    res.write(': connected\n\n');
    res.write(settingsEvent());
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/index.html' || u.pathname === '/name-writer.html')) {
    fs.readFile(PAGE, (err, data) => {
      if (err) { res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('name-writer.html must be in the same folder as relay.js'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(data);
    });
    return;
  }

  if (req.method === 'GET' && u.pathname === '/test') {
    const name = (u.searchParams.get('name') || '').trim().slice(0, 24);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    if (!name) { res.statusCode = 400; return res.end('Add a name, e.g. /test?name=Alex'); }
    const paid = u.searchParams.get('paid') === '1';
    broadcast({ author: 'test-' + Math.random().toString(36).slice(2, 8), text: '!name ' + name, paid });
    return res.end(`Sent "${name}"${paid ? ' as a Super Chat' : ''} - look at your overlay.`);
  }

  if (req.method === 'POST' && u.pathname === '/msg') {
    readBody(req, 5000, body => {
      try { broadcast(JSON.parse(body)); res.end('ok'); }
      catch (e) { res.statusCode = 400; res.end('bad'); }
    });
    return;
  }

  if (req.method === 'POST' && u.pathname === '/settings') {
    readBody(req, 60000, body => {
      try {
        shared = cleanSettings(JSON.parse(body));
        fs.writeFile(SETTINGS_FILE, JSON.stringify(shared, null, 1), err => { if (err) console.log('could not save settings.json:', err.message); });
        const ev = settingsEvent();
        for (const c of clients) c.write(ev);
        res.end('ok');
      } catch (e) { res.statusCode = 400; res.end('bad'); }
    });
    return;
  }
  res.statusCode = 404; res.end();
}).listen(PORT, '127.0.0.1', () => console.log(`Relay running.\n  Open the page:  http://127.0.0.1:${PORT}/\n  Quick test:     http://127.0.0.1:${PORT}/test?name=Alex`));
