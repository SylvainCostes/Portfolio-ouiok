import type { CollectionEntry } from 'astro:content'
import type { Article, Person, WebSite, WithContext } from 'schema-dts'

import { projectMetaData } from './metaData'

export const mainWebsite: WithContext<WebSite> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: import.meta.env.SITE,
  name: 'Sylvain Costes - Platform Engineer',
  description:
    'Platform Engineer passionate about web development and cloud technologies, based in Paris, France.',
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
  '@id': 'https://sylvaincostes.com/#person',
  name: 'Sylvain Costes',
  alternateName: ['Sylvain Costes Platform Engineer', 'sylvaincostes'],
  givenName: 'Sylvain',
  familyName: 'Costes',
  url: import.meta.env.SITE,
  mainEntityOfPage: import.meta.env.SITE,
  identifier: [
    'https://sylvaincostes.com/#person',
    'https://github.com/sylvaincostes'
  ],
  image: `${import.meta.env.SITE}/avatar.jpg`,
  email: 'contact@sylvaincostes.com',
  disambiguatingDescription:
    'Official profile of Sylvain Costes, Platform Engineer in Paris specialized in Azure, Kubernetes, Terraform and infrastructure automation.',
  sameAs: [
    'https://github.com/sylvaincostes',
    'https://www.linkedin.com/in/sylvain-costes/',
    'https://twitter.com/sylvaincostes',
    'https://x.com/sylvaincostes',
    'https://malt.fr/profile/sylvaincostes'
  ],
  jobTitle: 'Platform Engineer',
  description:
    'Platform Engineer at Societe Generale CIB focused on Azure, AKS, Terraform, Kubernetes and CI/CD automation.',
  knowsAbout: [
    'Platform Engineering',
    'Cloud Native Infrastructure',
    'Infrastructure as Code',
    'DevOps',
    'Site Reliability Engineering',
    'Kubernetes',
    'Terraform',
    'Azure Kubernetes Service (AKS)',
    'GitHub Actions',
    'Docker',
    'Linux'
  ],
  knowsLanguage: ['en', 'fr'],
  nationality: {
    '@type': 'Country',
    name: 'France'
  },
  hasOccupation: {
    '@type': 'Occupation',
    name: 'Platform Engineer',
    skills: 'Kubernetes, Terraform, AKS, GitHub Actions, Docker, Linux'
  },
  affiliation: {
    '@type': 'Organization',
    name: 'Société Générale Corporate and Investment Banking',
    alternateName: 'SG CIB',
    url: 'https://www.societegenerale.com'
  },
  memberOf: {
    '@type': 'Organization',
    name: 'Société Générale Corporate and Investment Banking',
    alternateName: 'SG CIB',
    url: 'https://www.societegenerale.com'
  },
  worksFor: {
    '@type': 'Organization',
    name: 'Société Générale Corporate and Investment Banking',
    alternateName: 'SG CIB',
    url: 'https://wholesale.banking.societegenerale.com/',
    sameAs: 'https://www.societegenerale.com',
    parentOrganization: {
      '@type': 'Organization',
      name: 'Societe Generale',
      url: 'https://www.societegenerale.com'
    }
  },
  alumniOf: [
    {
      '@type': 'CollegeOrUniversity',
      name: 'Université Paris Nanterre',
      sameAs: 'https://www.wikidata.org/wiki/Q1394262'
    }
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Paris',
    addressRegion: 'Ile-de-France',
    addressCountry: 'FR'
  },
  subjectOf: [
    {
      '@type': 'WebPage',
      url: `${import.meta.env.SITE}/about/`,
      name: 'About Sylvain Costes'
    },
    {
      '@type': 'WebPage',
      url: `${import.meta.env.SITE}/fr/about/`,
      name: 'A propos de Sylvain Costes'
    }
  ]
}


export function getProjectSchema(post: CollectionEntry<'projects'>) {
  const articleStructuredData: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.data.title,
    url: `${import.meta.env.SITE}/projects/${post.id}/`,
    image: {
      '@type': 'ImageObject',
      url: `${import.meta.env.SITE}${typeof post.data.heroImage === 'string' ? post.data.heroImage : post.data.heroImage.src}/`
    },
    description: post.data.description,
    // datePublished
    publisher: personSchema,
    author: personSchema
  }
  return articleStructuredData
}
