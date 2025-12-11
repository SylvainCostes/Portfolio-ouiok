import { ImageResponse } from '@vercel/og'
import type {
  APIRoute,
  GetStaticPaths,
  InferGetStaticParamsType,
  InferGetStaticPropsType
} from 'astro'
import { type CollectionEntry, getCollection } from 'astro:content'
import fs from 'fs'
import path from 'path'
import type { ReactElement } from 'react'

type AllCollectionEntry = CollectionEntry<'projects' | 'blog'>

type OGAPIRoute = APIRoute<
  InferGetStaticPropsType<typeof getStaticPaths>,
  InferGetStaticParamsType<typeof getStaticPaths>
>

const generateHtml = (data: AllCollectionEntry['data']): ReactElement => {
  const image = fs.readFileSync(
    path.resolve(process.cwd(), 'public/images/og_background.png')
  )

  return {
    key: 'html',
    type: 'div',
    props: {
      tw: 'h-full w-full p-32 pt-28 flex flex-col relative',
      style: {
        fontFamily: 'Switzer Medium'
      },
      children: [
        {
          type: 'img',
          props: {
            tw: 'absolute left-0 top-0',
            src: image.buffer,
            width: 1200,
            height: 630
          }
        },
        {
          type: 'div',
          props: {
            tw: 'flex self-start items-center rounded-full gap-4 py-3 pl-3 pr-4 border border-slate-600 text-white',
            children: [
              {
                type: 'div',
                props: {
                  tw: 'w-8 h-8 mr-4 bg-green-300 text-green-300 rounded-full'
                }
              },
              {
                type: 'div',
                props: {
                  tw: 'text-3xl flex',
                  children: [
                    {
                      type: 'div',
                      props: {
                        tw: 'mr-5',
                        children: 'Jesica'
                      }
                    },
                    {
                      type: 'div',
                      props: {
                        tw: 'mr-5',
                        children: '|'
                      }
                    },
                    {
                      type: 'div',
                      props: {
                        tw: 'mr-5',
                        children: 'jestsee.com'
                      }
                    }
                  ]
                }
              }
            ],
            style: {
              fontFamily: 'Switzer Medium'
            }
          }
        },
        {
          type: 'div',
          props: {
            tw: 'text-6xl font-bold text-white mt-12 tracking-tight',
            children: data.title,
            style: {
              fontFamily: 'Switzer Semi Bold'
            }
          }
        },
        {
          type: 'div',
          props: {
            tw: 'mt-8 text-3xl font-medium text-slate-300',
            children: data.description
          }
        }
      ]
    }
  }
}

export const GET: OGAPIRoute = async ({ props }) => {
  const {
    posts: { data }
  } = props
  const html = generateHtml(data)

  const SwitzerMedium = fs.readFileSync(
    path.resolve(process.cwd(), 'public/fonts/Switzer-Medium.otf')
  )

  const SwitzerSemiBold = fs.readFileSync(
    path.resolve(process.cwd(), 'public/fonts/Switzer-Semibold.otf')
  )

  return new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Switzer Semi Bold',
        data: SwitzerSemiBold.buffer as ArrayBuffer,
        style: 'normal'
      },
      {
        name: 'Switzer Medium',
        data: SwitzerMedium.buffer as ArrayBuffer,
        style: 'normal'
      }
    ]
  })
}

// getStaticPaths is used to limit the OG images generated.
// This prevents dynamic generation of OG images, which could be abused.
// Instead, OG images are generated only for existing articles during build time.
export const getStaticPaths = (async () => {
  const projects = await getCollection('projects')
  const blog = await getCollection('blog')

  return [...projects, ...blog].map((posts) => ({
    params: {
      slug: posts.id // used as the key to map the og photo to the posts
    },
    props: { posts }
  }))
}) satisfies GetStaticPaths
