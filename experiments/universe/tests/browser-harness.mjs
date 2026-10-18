// Local QA proxy: these overrides are never imported by the page or its bundle.
import { createServer, request } from 'node:http'

const target = new URL(process.env.UNIVERSE_PREVIEW_URL ?? 'http://127.0.0.1:4324')
const port = Number(process.env.UNIVERSE_QA_PORT ?? 4325)
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`)
    const scenario = url.searchParams.get('scenario')
    // Do not normalize Astro's bare ?astro / &lang.ts module query flags.
    if (scenario !== null) url.searchParams.delete('scenario')
    const upstream = await fetch(new URL(url.pathname + url.search, target), { redirect: 'manual' })
    const headers = Object.fromEntries(upstream.headers)
    delete headers['content-length']
    delete headers['content-encoding']
    let body = Buffer.from(await upstream.arrayBuffer())
    if (headers['content-type']?.includes('text/html')) {
      let html = body.toString()
      if (scenario === 'no-js') html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
      let setup = ''
      if (scenario === 'capture') setup += `
        const captureRAF = window.requestAnimationFrame.bind(window);
        let captureRequested = false;
        window.captureUniverse = () => { captureRequested = true; };
        window.requestAnimationFrame = callback => captureRAF(time => {
          const previousFrames = document.getElementById('universe-canvas')?.dataset.frames;
          callback(time);
          const canvas = document.getElementById('universe-canvas');
          if (captureRequested && canvas?.dataset.scene === 'ready' && canvas.dataset.frames !== previousFrames) {
            captureRequested = false;
            canvas.toBlob(blob => {
              if (!blob) return;
              const link = document.createElement('a');
              const objectURL = URL.createObjectURL(blob);
              link.href = objectURL;
              link.download = 'universe-v2.jpg';
              link.click();
              setTimeout(() => URL.revokeObjectURL(objectURL), 30000);
            }, 'image/jpeg', .95);
          }
        });`
      if (scenario === 'webgl-disabled') setup += `
        const nativeContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          return /webgl/i.test(type) ? null : nativeContext.call(this, type, ...args);
        };`
      if (scenario === 'reduced') setup += `
        const nativeMedia = window.matchMedia.bind(window);
        window.matchMedia = query => query === '(prefers-reduced-motion: reduce)'
          ? { matches: true, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }
          : nativeMedia(query);`
      if (scenario === 'background') setup += `
        let qaHidden = false;
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => qaHidden });
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => qaHidden ? 'hidden' : 'visible' });
        window.toggleQABackground = () => {
          qaHidden = !qaHidden;
          document.documentElement.dataset.qaHidden = String(qaHidden);
          document.dispatchEvent(new Event('visibilitychange'));
        };`
      if (setup) html = html.replace('<head>', `<head><script>${setup}</script>`)
      if (scenario === 'reduced') html = html.replace('</head>', '<style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head>')
      if (scenario === 'context-loss') html = html.replace('</body>', `<button id="qa-context-loss" style="position:fixed;z-index:999;bottom:8px;left:8px;padding:12px" onclick="document.getElementById('universe-canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()">Simuler une perte WebGL</button></body>`)
      if (scenario === 'background') html = html.replace('</body>', '<button id="qa-background" style="position:fixed;z-index:999;bottom:8px;left:8px;padding:12px" onclick="window.toggleQABackground()">Simuler un onglet masqué</button></body>')
      if (scenario === 'capture') html = html.replace('</body>', '<button id="qa-capture" style="position:fixed;z-index:999;bottom:8px;left:8px;padding:12px" onclick="window.captureUniverse()">Capturer le rendu 3D</button></body>')
      body = Buffer.from(html)
    }
    res.writeHead(upstream.status, headers)
    res.end(body)
  } catch (error) {
    res.writeHead(502)
    res.end(String(error))
  }
})

// Preserve Astro/Vite HMR without generating misleading connection errors.
server.on('upgrade', (req, socket, head) => {
  const upstream = request(new URL(req.url, target), {
    headers: { ...req.headers, host: target.host }
  })
  upstream.on('upgrade', (response, remote, remoteHead) => {
    socket.write(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n`)
    for (let i = 0; i < response.rawHeaders.length; i += 2) {
      socket.write(`${response.rawHeaders[i]}: ${response.rawHeaders[i + 1]}\r\n`)
    }
    socket.write('\r\n')
    if (remoteHead.length) socket.write(remoteHead)
    if (head.length) remote.write(head)
    socket.pipe(remote).pipe(socket)
    socket.on('error', () => remote.destroy())
    remote.on('error', () => socket.destroy())
  })
  upstream.on('error', () => socket.destroy())
  upstream.end()
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Universe QA only: http://127.0.0.1:${port}/universe?scenario=reduced`)
})
