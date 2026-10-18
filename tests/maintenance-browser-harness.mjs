// Local-only QA fixture. Never imported by Astro or included in the image.
// Run after starting the production preview on 127.0.0.1:4322.
import { createServer } from 'node:http'

const target = 'http://127.0.0.1:4322'
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1:4323')
    const upstream = await fetch(new URL(url.pathname, target), { redirect: 'manual' })
    const headers = Object.fromEntries(upstream.headers)
    delete headers['content-length']
    delete headers['content-encoding']
    let body = Buffer.from(await upstream.arrayBuffer())
    if (headers['content-type']?.includes('text/html')) {
      let html = body.toString()
      const scenario = url.searchParams.get('scenario')
      if (scenario === 'no-js') html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
      let setup = ''
      if (scenario === 'webgl-disabled') setup += `
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          return /webgl/i.test(type) ? null : getContext.call(this, type, ...args);
        };`
      if (scenario === 'reduced') setup += `
        const nativeMatchMedia = window.matchMedia.bind(window);
        window.matchMedia = query => query === '(prefers-reduced-motion: reduce)'
          ? { matches: true, media: query, addEventListener() {}, removeEventListener() {} }
          : nativeMatchMedia(query);`
      setup += `
        const raf = window.requestAnimationFrame.bind(window);
        let frames = 0;
        window.requestAnimationFrame = callback => raf(time => {
          document.documentElement.dataset.qaFrames = String(++frames);
          callback(time);
        });`
      html = html.replace('<head>', `<head><script>${setup}</script>`)
      // JS matchMedia is simulated above; test the CSS reduce rule independently.
      if (scenario === 'reduced') html = html.replace('</head>', '<style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head>')
      if (scenario === 'context-loss') html = html.replace('</body>', `<button style="position:fixed;bottom:8px;left:8px" onclick="document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()">Simuler une perte WebGL</button></body>`)
      body = Buffer.from(html)
    }
    res.writeHead(upstream.status, headers)
    res.end(body)
  } catch (error) {
    res.writeHead(502)
    res.end(String(error))
  }
}).listen(4323, '127.0.0.1', () => console.log('QA only: http://127.0.0.1:4323/?scenario=reduced'))
