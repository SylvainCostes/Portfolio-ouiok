import assert from 'node:assert/strict'
import { test } from 'node:test'

const preview = process.env.UNIVERSE_PREVIEW_URL ?? 'http://localhost:4321'
const original = process.env.MAINTENANCE_PREVIEW_URL ?? 'http://127.0.0.1:4324'

function identity(html) {
  return {
    title: html.match(/<title>(.*?)<\/title>/s)?.[1],
    canonical: html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1],
    heading: html.match(/<h1\b[^>]*>(.*?)<\/h1>/s)?.[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    contact: html.match(/href="(mailto:[^"]+)"/)?.[1],
    canvasCount: (html.match(/<canvas\b/g) ?? []).length,
    body: html.match(/<body[^>]*>(.*?)<\/body>/s)?.[1]
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/\s+/g, ' ').trim()
  }
}

test('the development preview adds only the universe page and leaves maintenance intact', async (t) => {
  await t.test('/universe loads the isolated prototype', async () => {
    const response = await fetch(`${preview}/universe`, { redirect: 'manual' })
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /<canvas\b/)
    assert.match(html, /Sylvain Costes/i)
    assert.match(html, /universe/i)
    assert.doesNotMatch(html, /Tout se/)
  })

  await t.test('the current homepage keeps the same content and SEO metadata', async () => {
    const [before, after] = await Promise.all([fetch(`${original}/`), fetch(`${preview}/`)])
    assert.equal(before.status, 200)
    assert.equal(after.status, 200)
    assert.deepEqual(identity(await after.text()), identity(await before.text()))
    assert.equal(after.headers.get('x-robots-tag'), null)
    assert.equal(after.headers.get('retry-after'), null)
  })

  for (const path of ['/fr', '/about', '/blog/anything', '/api/github', '/unknown/deep/path', '/universe/unknown']) {
    await t.test(`${path} still redirects temporarily to maintenance`, async () => {
      const response = await fetch(`${preview}${path}`, { redirect: 'manual' })
      assert.equal(response.status, 302)
      assert.equal(response.headers.get('location'), '/')
    })
  }
  await t.test('robots remains unchanged', async () => {
    const response = await fetch(`${preview}/robots.txt`)
    assert.equal(response.status, 200)
    assert.equal(await response.text(), 'User-agent: *\nAllow: /\n')
  })
})
