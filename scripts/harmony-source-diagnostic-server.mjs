import fs from 'node:fs'
import http from 'node:http'
import { pathToFileURL } from 'node:url'

export function instrumentSource(script, collectorUrl = null) {
  const name = script.match(/@name\s+([^\r\n]+)/)?.[1].trim() ?? 'Source'
  const version = script.match(/@version\s+([^\r\n]+)/)?.[1].trim() ?? '1'
  return `/**\n * @name [诊断] ${name}\n * @version ${version}\n */
;(function(originalGlobals) {
  const originalApi = originalGlobals.lx;
  const originalScript = ${JSON.stringify(script)};
  const report = record => {
    console.log('[LX_SOURCE_HTTP] ' + JSON.stringify(record));
    try {
      if (${Boolean(collectorUrl)}) originalApi.request(${JSON.stringify(collectorUrl)}, { method: 'POST', body: record }, () => {});
    } catch {}
  };
  const diagnosticApi = {
    ...originalApi,
    currentScriptInfo: { ...originalApi.currentScriptInfo, name: ${JSON.stringify(name)}, version: ${JSON.stringify(version)}, rawScript: originalScript },
    request(url, options, callback) {
      const headers = {};
      for (const [header, value] of Object.entries(options.headers || {})) {
        headers[header] = ['user-agent', 'ver', 'source-ver', 'tag', 'accept', 'content-type'].includes(header.toLowerCase()) ? value : '[omitted]';
      }
      report({ event: 'request', url, method: options.method || 'get', headers });
      return originalApi.request(url, options, (error, response, body) => {
        report({ event: 'response', url, error: error ? String(error.message || error) : null, statusCode: response ? response.statusCode : null, bodyType: typeof body, code: body && typeof body === 'object' ? body.code : undefined });
        callback(error, response, body);
      });
    },
  };
  report({ event: 'startup', version: originalApi.version, env: originalApi.env, name: ${JSON.stringify(name)} });
  const diagnosticGlobals = Object.create(originalGlobals, { lx: { value: diagnosticApi } });
  (function(globalThis) {
${script}
  })(diagnosticGlobals);
})(globalThis);
`
}

function serve(sourcePath, port) {
  const script = fs.readFileSync(sourcePath, 'utf8')
  if (Buffer.byteLength(script) > 9_000_000) throw new Error('Source exceeds 9 MB')
  const diagnostic = instrumentSource(script, `http://127.0.0.1:${port}/events`)
  const server = http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/source.js') {
      response.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' })
      response.end(diagnostic)
      return
    }
    if (request.method === 'POST' && request.url === '/events') {
      let body = ''
      request.setEncoding('utf8')
      request.on('data', chunk => {
        body += chunk
        if (Buffer.byteLength(body) > 65536) request.destroy()
      })
      request.on('end', () => {
        try {
          console.log('[LX_SOURCE_HTTP]', JSON.stringify(JSON.parse(body)))
          response.writeHead(204)
        } catch {
          response.writeHead(400)
        }
        response.end()
      })
      return
    }
    response.writeHead(404)
    response.end()
  })
  server.listen(port, '127.0.0.1', () => {
    console.log(`Import URL: http://127.0.0.1:${port}/source.js`)
    console.log(`Device forwarding: hdc rport tcp:${port} tcp:${port}`)
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--file') {
    if (!process.argv[3] || !process.argv[4]) throw new Error('Usage: node scripts/harmony-source-diagnostic-server.mjs --file <source-file> <output-file>')
    const diagnostic = instrumentSource(fs.readFileSync(process.argv[3], 'utf8'))
    if (Buffer.byteLength(diagnostic) > 9_000_000) throw new Error('Diagnostic source exceeds 9 MB')
    fs.writeFileSync(process.argv[4], diagnostic)
    console.log(`Local import file: ${process.argv[4]}`)
  } else {
    const port = Number(process.argv[3] ?? 18080)
    if (!process.argv[2] || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('Usage: node scripts/harmony-source-diagnostic-server.mjs <source-file> [port]')
    }
    serve(process.argv[2], port)
  }
}
