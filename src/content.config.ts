import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

import { iconSchema } from './content/_icons'

export const blogFr = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/blog-fr' }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      heroImage: z.string(),
      tags: z.array(z.string()).optional().default([]),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      readingTime: z.number().optional(),
      wordsCount: z.number().optional(),
      latestCommitUrl: z.string().optional()
    })
})

export const projectsFr = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/projects-fr' }),
  schema: ({ image }) =>
    z
      .object({
        year: z.number(),
        title: z.string(),
        htmlTitle: z.string().optional(),
        description: z.string(),
        heroImage: z.union([image(), z.string()]),
        heroImageAlign: z.enum(['top', 'center']).default('top'),
        tags: z.array(z.string()).optional().default([]),
        universe: z.enum(['platform', 'security', 'innovation']).optional(),
        type: z.enum(['project', 'experience', 'thesis']).default('project'),
        company: z.string().optional(),
        role: z.string().optional(),
        period: z.string().optional(),
        links: z
          .array(
            z.object({
              icon: iconSchema,
              name: z.string(),
              url: z.string()
            })
          )
          .optional()
          .default([]),
        readingTime: z.number().optional(),
        wordsCount: z.number().optional(),
        updatedDate: z.coerce.date().optional(),
        latestCommitUrl: z.string().optional()
      })
      .transform((data) => ({
        ...data,
        htmlTitle: data.htmlTitle || data.title
      }))
})

export const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/blog' }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      heroImage: z.string(),
      tags: z.array(z.string()).optional().default([]),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      readingTime: z.number().optional(),
      wordsCount: z.number().optional(),
      latestCommitUrl: z.string().optional()
    })
})

export const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        year: z.number(),
        title: z.string(),
        htmlTitle: z.string().optional(),
        description: z.string(),
        heroImage: z.union([image(), z.string()]),
        heroImageAlign: z.enum(['top', 'center']).default('top'),
        tags: z.array(z.string()).optional().default([]),
        universe: z.enum(['platform', 'security', 'innovation']).optional(),
        /** 'experience' = professional role, 'thesis' = academic, 'project' = personal project */
        type: z.enum(['project', 'experience', 'thesis']).default('project'),
        company: z.string().optional(),
        role: z.string().optional(),
        period: z.string().optional(),
        links: z
          .array(
            z.object({
              icon: iconSchema,
              name: z.string(),
              url: z.string()
            })
          )
          .optional()
          .default([]),
        readingTime: z.number().optional(),
        wordsCount: z.number().optional(),
        updatedDate: z.coerce.date().optional(),
        latestCommitUrl: z.string().optional()
      })
      .transform((data) => ({
        ...data,
        htmlTitle: data.htmlTitle || data.title
      }))
})

export const collections = {
  blog,
  projects,
  blogFr,
  projectsFr
}
