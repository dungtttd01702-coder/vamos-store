/**
 * Minimal Built-In HTTP Health Check Server for Dedicated Loyalty Worker
 * - Zero external dependencies (Node.js built-in http)
 * - Exposes liveness (/health, /health/live) & readiness (/health/ready)
 * - Never exposes PII, credentials, or query payloads
 */

const http = require('node:http');

function createWorkerHealthServer({ getHealthSnapshot, host = '127.0.0.1', port = 3100 } = {}) {
  if (typeof getHealthSnapshot !== 'function') {
    throw new Error('createWorkerHealthServer requires getHealthSnapshot');
  }

  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    const urlPath = (req.url || '').split('?')[0];
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    if (urlPath === '/health' || urlPath === '/health/live') {
      const snap = getHealthSnapshot();
      res.statusCode = snap.liveness ? 200 : 503;
      res.end(JSON.stringify(snap));
      return;
    }

    if (urlPath === '/health/ready') {
      const snap = getHealthSnapshot();
      res.statusCode = snap.readiness ? 200 : 503;
      res.end(JSON.stringify(snap));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  function start() {
    return new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => {
        server.removeListener('error', reject);
        const addr = server.address();
        resolve({
          host: typeof addr === 'object' && addr ? addr.address : host,
          port: typeof addr === 'object' && addr ? addr.port : port
        });
      });
    });
  }

  function close() {
    return new Promise((resolve) => {
      if (!server.listening) {
        resolve();
        return;
      }
      server.close(() => resolve());
    });
  }

  return { server, start, close };
}

module.exports = { createWorkerHealthServer };
