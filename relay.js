// Run: node relay.js   (no npm install needed)
// Userscript POSTs chat messages to /msg; name-writer.html listens on /events (SSE).
const http = require('http');
const clients = new Set();

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.end();

  if (req.url === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (req.method === 'POST' && req.url === '/msg') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 5000) req.destroy(); });
    req.on('end', () => {
      try {
        const m = JSON.parse(body);
        const line = JSON.stringify({ author: String(m.author || '').slice(0, 60), text: String(m.text || '').slice(0, 200), paid: !!m.paid });
        console.log(line);
        for (const c of clients) c.write(`data: ${line}\n\n`);
        res.end('ok');
      } catch (e) { res.statusCode = 400; res.end('bad'); }
    });
    return;
  }
  res.statusCode = 404; res.end();
}).listen(8787, '127.0.0.1', () => console.log('Relay on http://127.0.0.1:8787  (events: /events, post: /msg)'));
