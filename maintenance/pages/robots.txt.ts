import type { APIRoute } from 'astro'

// Keep crawling allowed. Old URLs temporarily redirect; the homepage is indexable.
export const GET: APIRoute = () =>
  new Response('User-agent: *\nAllow: /\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  })
