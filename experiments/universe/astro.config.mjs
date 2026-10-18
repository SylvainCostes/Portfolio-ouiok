// This configuration is an explicit, local-only preview entry point.
// The production Astro configuration never imports this file.
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import base from '../../astro.config.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))

/** @type {import('astro').AstroIntegration} */
const universePreview = {
  name: 'universe-development-preview',
  hooks: {
    'astro:config:setup': ({ command }) => {
      if (command === 'build' || command === 'preview') {
        throw new Error(
          'The universe experiment is development-only. Use node experiments/universe/preview.mjs. Production builds must use the unchanged root Astro configuration.'
        )
      }
      if (process.env.MAINTENANCE_MODE === 'false') {
        throw new Error(
          'This preview preserves the current maintenance homepage. Unset MAINTENANCE_MODE before starting the universe preview.'
        )
      }
      // The root config registers the optional route for dev on every local port.
    }
  }
}

export default defineConfig({
  ...base,
  root,
  // Keep the existing dev server's integration cache independent.
  cacheDir: './node_modules/.astro-universe',
  server: { ...base.server, host: '127.0.0.1', port: 4324 },
  integrations: [...(base.integrations ?? []), universePreview]
})
