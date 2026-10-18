import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve, relative, sep } from 'node:path'
import { test } from 'node:test'
import config from '../astro.config.mjs'
import productionConfig from '../../../astro.config.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const snapshot = JSON.parse(await readFile(new URL('./protected-files.snapshot.json', import.meta.url), 'utf8'))
const approved = JSON.parse(await readFile(new URL('./approved-local-routing.json', import.meta.url), 'utf8'))
const protectedDirectories = ['maintenance', 'src', 'public', 'scripts', '.github']
const protectedFiles = ['astro.config.mjs', 'Dockerfile', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'README.md', 'PRODUCT.md', 'tsconfig.json', 'tsconfig.maintenance.json']

async function filesUnder(directory) {
  const entries = await readdir(resolve(root, directory), { withFileTypes: true })
  const results = await Promise.all(entries.map(async (entry) => {
    const name = `${directory}/${entry.name}`
    return entry.isDirectory() ? filesUnder(name) : [name]
  }))
  return results.flat()
}

test('all original files retain their exact contents except the explicitly approved dev-only routing addition', async () => {
  const current = [...protectedFiles, ...(await Promise.all(protectedDirectories.map(filesUnder))).flat()].sort()
  assert.deepEqual(current, Object.keys(snapshot).sort(), 'A protected file was added or removed')
  for (const [path, expected] of Object.entries(snapshot)) {
    const actual = createHash('sha256').update(await readFile(resolve(root, path))).digest('hex')
    if (path === 'astro.config.mjs') {
      assert.equal(expected, approved.originalSha256, 'The original protected snapshot must remain intact')
      assert.equal(actual, approved.approvedSha256, 'The approved routing config changed')
    } else assert.equal(actual, expected, `Protected file changed: ${path}`)
  }
})

test('the ordinary Astro configuration adds /universe only for dev, never build/preview/sync', async () => {
  const integration = productionConfig.integrations.find((item) => item.name === 'local-universe-preview')
  const setup = integration.hooks['astro:config:setup']
  const routes = []
  await setup({ command: 'dev', injectRoute: (route) => routes.push(route) })
  assert.equal(routes.length, 1)
  assert.equal(routes[0].pattern, '/universe')
  assert.equal(relative(root, routes[0].entrypoint).split(sep).join('/'), 'experiments/universe/Universe.astro')
  assert.equal(routes[0].prerender, false)
  for (const command of ['build', 'preview', 'sync']) {
    await setup({ command, injectRoute() { assert.fail('A non-development route was injected') } })
  }
})

test('the optional separate preview retains its production command guard', () => {
  const integration = config.integrations.find((item) => item.name === 'universe-development-preview')
  for (const command of ['build', 'preview']) {
    assert.throws(() => integration.hooks['astro:config:setup']({ command }), /development-only/)
  }
})

test('the preview inherits the protected homepage and public directory', () => {
  assert.equal(config.srcDir, './maintenance')
  assert.equal(config.publicDir, './maintenance/public')
  assert.equal(config.output, 'server')
  assert.equal(config.server.host, '127.0.0.1')
})
