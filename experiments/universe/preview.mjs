import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const version = Number(process.versions.node.split('.')[0])
if (version < 22) {
  console.error('The universe preview requires Node.js 22 or newer, matching the project runtime.')
  process.exit(1)
}

const port = process.argv[2] ?? '4324'
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  console.error('Usage: node experiments/universe/preview.mjs [port]')
  process.exit(1)
}

const server = spawn(process.execPath, [
  fileURLToPath(new URL('../../node_modules/astro/astro.js', import.meta.url)),
  'dev', '--config', 'experiments/universe/astro.config.mjs',
  '--host', '127.0.0.1', '--port', port
], { cwd: root, env: process.env, stdio: 'inherit' })

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal))
}
server.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
server.on('exit', (code) => { process.exitCode = code ?? 0 })
