const http = require('http');

/**
 * Send an HTTP request to a local test HTTP server.
 * @param {import('http').Server} server
 * @param {string} path
 * @param {object} [options]
 * @returns {Promise<{ status: number, headers: import('http').IncomingHttpHeaders, body: string }>}
 */
function makeRequest(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

module.exports = { makeRequest };
