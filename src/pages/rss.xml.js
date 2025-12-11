import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

import { mainMetaData } from '@/lib/metaData'

const parser = new MarkdownIt()

export async function GET(context) {
  const posts = await getCollection('blog')

  return rss({
    title: mainMetaData.title,
    description: mainMetaData.description,
    site: context.site,
    items: posts.map((post) => ({
      ...post.data,
      link: `/blog/${post.id}/`,
      content: sanitizeHtml(parser.render(post.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
      })
    }))
  })
}
