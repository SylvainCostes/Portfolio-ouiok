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

// https://astro.build/config
export default defineConfig({
  adapter,
  output: 'static',
  site: 'https://sylvaincostes.fr',

  image: {
    domains: ['images.unsplash.com', 'res.cloudinary.com', 'plus.unsplash.com'],
    service: passthroughImageService()
  },

  i18n: {
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

  prefetch: {
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
      }),


    }
  },

  vite: {
    ssr: {
      noExternal: ['path-to-regexp', 'react-tweet']
    }
  },

  integrations: [
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
