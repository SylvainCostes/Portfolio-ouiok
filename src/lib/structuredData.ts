import type { CollectionEntry } from 'astro:content'
import type { Article, Person, WebSite, WithContext } from 'schema-dts'

import { projectMetaData } from './metaData'

export const mainWebsite: WithContext<WebSite> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: import.meta.env.SITE,
  name: 'Sylvain Costes - Software Engineer',
  description:
    'Software Engineer passionate about web development and cloud technologies, based in Paris, France.',
  inLanguage: 'en_US'
}

export const projectWebsite: WithContext<WebSite> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: `${import.meta.env.SITE}/projects/`,
  name: 'Projects',
  description: projectMetaData.description,
  inLanguage: 'en_US'
}

export const personSchema: WithContext<Person> = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Sylvain Costes',
  url: 'https://sylvaincostes.fr',
  // image: `${import.meta.env.SITE}${avatar.src}`,
  sameAs: [
    'https://github.com/sylvaincostes',
    'https://www.linkedin.com/in/sylvaincs/'
  ],
  jobTitle: 'Software engineer',
  worksFor: {
    '@type': 'Organization',
     name: 'Société Générale CIB',
     url: 'https://societegenerale.com',
   },
}

export function getProjectSchema(post: CollectionEntry<'projects'>) {
  const articleStructuredData: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.data.title,
    url: `${import.meta.env.SITE}/projects/${post.id}/`,
    image: {
      '@type': 'ImageObject',
      url: `${import.meta.env.SITE}${post.data.heroImage.src}/`
    },
    description: post.data.description,
    // datePublished
    publisher: personSchema,
    author: personSchema
  }
  return articleStructuredData
}
