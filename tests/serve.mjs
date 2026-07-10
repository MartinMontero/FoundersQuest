// Static server for dist/ that applies the real public/_headers and mocks the
// Council endpoint — so e2e exercises the true security headers and CSP without
// needing a live Anthropic key.
import http from 'http'
import { readFileSync, existsSync, statSync } from 'fs'
import { extname, join } from 'path'

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

export function startServer({ dist = 'dist', port = 0 } = {}) {
  const headers = {}
  try {
    for (const line of readFileSync(join(dist, '_headers'), 'utf8').split('\n')) {
      const m = line.match(/^\s+([A-Za-z-]+):\s*(.+)$/)
      if (m) headers[m[1]] = m[2]
    }
  } catch {
    /* no _headers present */
  }
  const server = http.createServer((req, res) => {
    if (req.url === '/api/council' && req.method === 'POST') {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json', ...headers })
        res.end(JSON.stringify({ text: 'MOCK COUNCIL READING — what the record shows.' }))
      })
      return
    }
    let path = req.url.split('?')[0]
    if (path === '/') path = '/index.html'
    const file = join(dist, path)
    if (existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', ...headers })
      res.end(readFileSync(file))
    } else {
      res.writeHead(404, { ...headers })
      res.end('not found')
    }
  })
  return new Promise((resolve) => {
    server.listen(port, () => resolve({ server, base: `http://localhost:${server.address().port}` }))
  })
}
