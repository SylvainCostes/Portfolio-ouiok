import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const astro = fileURLToPath(
  new URL('../node_modules/astro/astro.js', import.meta.url)
)
const maintenance = process.env.MAINTENANCE_MODE !== 'false'
const checks = maintenance
  ? ['check', '--tsconfig', 'tsconfig.maintenance.json']
  : ['check']
// Each mode checks its own source tree and its own generated content types.
const steps =
  !maintenance && process.argv.includes('--node')
    ? [['build']]
    : [checks, ['build']]
for (const args of steps) {
  const result = spawnSync(process.execPath, [astro, ...args], {
    stdio: 'inherit'
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
