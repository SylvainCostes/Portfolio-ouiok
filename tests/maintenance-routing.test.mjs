import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('production maintenance covers the entire public surface', async (t) => {
  // PORT=0 asks the OS for an unused port, so an existing preview is untouched.
  const server = spawn(process.execPath, ['dist/server/entry.mjs'], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  t.after(() => server.kill())
  const base = await new Promise((resolve, reject) => {
    let output = ''
    const timeout = setTimeout(
      () => reject(new Error(`Server did not start: ${output}`)),
      15000
    )
    server.on('error', reject)
    server.stdout.on('data', (chunk) => {
      output += chunk
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/)
      if (match) {
        clearTimeout(timeout)
        resolve(match[0])
      }
    })
    server.stderr.on('data', (chunk) => {
      output += chunk
    })
  })
  const paths = [
    '/',
    '/fr',
    '/fr/',
    '/about',
    '/about/',
    '/fr/about',
    '/blog',
    '/blog/homelab-raspberry-pi-devops',
    '/fr/blog/chatbot-3d-hackathon-viveris',
    '/projects/minishell-c',
    '/fr/projects/homelab-gitops',
    '/api/github',
    '/api/og/home',
    '/rss.xml',
    '/sitemap-index.xml',
    '/sitemap-0.xml',
    '/unknown/deep/route',
    '/index.html',
    '/fr/index.html',
    '/avatar.jpg',
    '/images/og_main.png',
    '/_astro/old-page.js',
    '/?MAINTENANCE_MODE=false',
    '/about?preview=true'
  ]
  for (const path of paths) {
    await t.test(`GET ${path}`, async () => {
      const response = await fetch(`${base}${path}`, { redirect: 'manual' })
      const home = new URL(path, base).pathname === '/'
      assert.equal(response.status, home ? 200 : 302)
      assert.equal(response.headers.get('retry-after'), null)
      assert.match(response.headers.get('cache-control'), /no-store/)
      assert.equal(response.headers.get('x-robots-tag'), null)
      const html = await response.text()
      if (home) {
        assert.match(html, /Building something\./)
        assert.match(html, /<html lang="fr"/)
        assert.match(
          html,
          /rel="canonical" href="https:\/\/sylvaincostes.com\/"/
        )
      } else {
        assert.equal(response.headers.get('location'), '/')
        assert.equal(html, '')
      }
      assert.doesNotMatch(html, /noindex|http-equiv="refresh"/i)
      assert.doesNotMatch(
        html,
        /BentoSection|github-contributions|Portfolio-ouiok/
      )
    })
  }
  for (const method of ['HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS']) {
    await t.test(`${method} cannot reach an original API`, async () => {
      const response = await fetch(`${base}/api/github`, {
        method,
        redirect: 'manual',
        headers: { Origin: base }
      })
      assert.equal(response.status, 302)
      assert.equal(response.headers.get('location'), '/')
      if (method === 'HEAD') assert.equal(await response.text(), '')
    })
  }
  await t.test(
    'cross-origin mutation requests remain protected by Astro',
    async () => {
      const response = await fetch(`${base}/api/github`, {
        method: 'POST',
        redirect: 'manual',
        headers: { Origin: 'https://example.com' }
      })
      assert.equal(response.status, 403)
    }
  )
  await t.test('redirect chain ends at the 200 homepage', async () => {
    const response = await fetch(`${base}/fr/projects/homelab-gitops`)
    assert.equal(response.status, 200)
    assert.equal(response.url, `${base}/`)
    assert.match(await response.text(), /Building something\./)
  })
  await t.test(
    'robots allows crawling without serving old sitemaps',
    async () => {
      const response = await fetch(`${base}/robots.txt`)
      assert.equal(response.status, 200)
      assert.equal(await response.text(), 'User-agent: *\nAllow: /\n')
    }
  )
  await t.test('maintenance assets load with correct MIME types', async () => {
    const html = await (await fetch(base)).text()
    const entry = html.match(/<script[^>]+src="([^"]+)"/)?.[1]
    assert.ok(entry)
    for (const [path, mime] of [
      [entry, /javascript/],
      ['/fonts/Switzer-Variable.woff2', /font\/woff2/],
      ['/maintenance-mark.svg', /image\/svg\+xml/]
    ]) {
      const response = await fetch(`${base}${path}`)
      assert.equal(response.status, 200)
      assert.match(response.headers.get('content-type'), mime)
    }
  })
  await t.test(
    'original pages and public assets are absent from the build',
    async () => {
      const files = await readdir('dist/client', { recursive: true })
      assert.ok(
        files.every((file) =>
          /^(?:_astro|fonts)(?:[\\/]|$)|^maintenance-mark\.svg$/.test(file)
        ),
        files.join('\n')
      )
      const manifestFiles = (await readdir('dist/server')).filter((file) =>
        file.startsWith('manifest_')
      )
      const manifest = await readFile(`dist/server/${manifestFiles[0]}`, 'utf8')
      assert.doesNotMatch(
        manifest,
        /src\/pages|\/projects\/\[id\]|\/blog\/\[id\]/
      )
    }
  )
  server.kill()
  await once(server, 'exit')
})
