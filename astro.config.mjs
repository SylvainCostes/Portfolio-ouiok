// @ts-check
import mdx from '@astrojs/mdx'
import node from '@astrojs/node'
import partytown from '@astrojs/partytown'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwind from '@astrojs/tailwind'
import { defineConfig, envField, passthroughImageService } from 'astro/config'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'

const adapter = node({ mode: 'standalone' })
// Maintenance is a build-time choice. Only an explicit false restores the portfolio.
const maintenance = process.env.MAINTENANCE_MODE !== 'false'

// The experiment stays outside production unless the image build opts in.
// Removing experiments/universe leaves the ordinary site fully functional.
/** @type {import('astro').AstroIntegration} */
const universeRoute = {
  name: 'universe-route',
  hooks: {
    'astro:config:setup': async ({ command, injectRoute }) => {
      const enabled = command === 'dev' ||
        (command === 'build' && process.env.ENABLE_UNIVERSE === 'true')
      if (!enabled) return
      const { existsSync } = await import('node:fs')
      const { fileURLToPath } = await import('node:url')
      const page = new URL('./experiments/universe/Universe.astro', import.meta.url)
      if (existsSync(page)) {
        injectRoute({ pattern: '/universe', entrypoint: fileURLToPath(page), prerender: false })
      }
    }
  }
}

// https://astro.build/config
export default defineConfig({
  adapter,
  output: maintenance ? 'server' : 'static',
  srcDir: maintenance ? './maintenance' : './src',
  publicDir: maintenance ? './maintenance/public' : './public',
  devToolbar: { enabled: !maintenance },
  site: 'https://sylvaincostes.com',

  image: {
    domains: ['images.unsplash.com', 'res.cloudinary.com', 'plus.unsplash.com'],
    service: passthroughImageService()
  },

  i18n: maintenance
    ? undefined
    : {
        defaultLocale: 'en',
        locales: ['en', 'fr'],
        routing: {
          prefixDefaultLocale: false
        }
      },

  markdown: {
    shikiConfig: {
      theme: 'poimandres'
    },
    syntaxHighlight: 'shiki'
  },

  prefetch: maintenance
    ? false
    : {
        prefetchAll: true,
        defaultStrategy: 'load'
      },

  env: {
    schema: {
      MAPTILER_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      GH_ACCESS_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      MONKEYTYPE_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      })
    }
  },

  vite: {
    ssr: {
      noExternal: ['path-to-regexp', 'react-tweet']
    }
  },

  integrations: maintenance
    ? [universeRoute]
    : [
        universeRoute,
        mdx({
          rehypePlugins: [
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              {
                behavior: 'wrap',
                headingProperties: {
                  class: 'article-heading'
                }
              }
            ]
          ]
        }),
        sitemap(),
        react(),
        tailwind({
          applyBaseStyles: false
        }),
        partytown()
      ]
})
