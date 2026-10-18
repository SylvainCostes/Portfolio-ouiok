import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { test } from 'node:test'

const root = fileURLToPath(new URL('../../../', import.meta.url))

test('the ordinary production build contains no universe page or experiment assets', async (t) => {
  const server = spawn(process.execPath, ['dist/server/entry.mjs'], {
    cwd: root,
    env: { ...process.env, HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  t.after(() => { if (server.exitCode === null) server.kill() })
  const base = await new Promise((resolveAddress, reject) => {
    let output = ''
    const timeout = setTimeout(() => reject(new Error(`Production server did not start: ${output}`)), 15000)
    server.on('error', (error) => { clearTimeout(timeout); reject(error) })
    server.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Production server exited (${code}): ${output}`)) })
    server.stdout.on('data', (chunk) => {
      output += chunk
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/)
      if (match) { clearTimeout(timeout); resolveAddress(match[0]) }
    })
    server.stderr.on('data', (chunk) => { output += chunk })
  })

  for (const path of ['/universe', '/universe/', '/universe?preview=true', '/experiments/universe/Universe.astro', '/experiments/universe/scripts/universe-scene.ts', '/universe/anything']) {
    await t.test(`GET ${path} is covered by production maintenance`, async () => {
      const response = await fetch(`${base}${path}`, { redirect: 'manual' })
      assert.equal(response.status, 302)
      assert.equal(response.headers.get('location'), '/')
      assert.equal(await response.text(), '')
    })
  }
  await t.test('production homepage retains its 200 response and content', async () => {
    const response = await fetch(base)
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /Building something\./)
    assert.doesNotMatch(html, /Engineering beyond|Platform Engineering|experiments\/universe|noindex/i)
  })
  await t.test('server and browser bundles do not import the experiment', async () => {
    for (const folder of ['dist/server', 'dist/client']) {
      const files = await readdir(resolve(root, folder), { recursive: true })
      assert.ok(files.every((name) => !/universe/i.test(name)), `An experiment file was emitted in ${folder}`)
      for (const name of files.filter((file) => /\.(?:m?js|html|css|json)$/.test(file))) {
        const content = await readFile(resolve(root, folder, name), 'utf8')
        assert.doesNotMatch(content, /experiments[\\/]universe|Universe\.astro|universe-scene|Engineering beyond the ordinary/, `${folder}/${name}`)
      }
    }
  })
  const exit = once(server, 'exit')
  server.kill()
  await exit
})
