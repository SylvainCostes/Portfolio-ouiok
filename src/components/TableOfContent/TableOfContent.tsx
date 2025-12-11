import type { MarkdownHeading } from 'astro'

import { cn } from '@/lib/utils'

interface Props {
  headings: MarkdownHeading[]
  className?: string
}

type GroupedHeadings = (MarkdownHeading | MarkdownHeading[])[]

const groupHeadings = (headings: MarkdownHeading[]): GroupedHeadings => {
  return headings.reduce<GroupedHeadings>((result, current, index) => {
    if (current.depth <= 2) result.push(current)
    // depth > 2
    else if (headings[index - 1]?.depth !== current.depth) {
      result.push([current])
    } else {
      ;(result[result.length - 1] as MarkdownHeading[]).push(current)
    }

    return result
  }, [])
}

const Heading = ({ slug, text }: MarkdownHeading) => {
  return (
    <li>
      <a className='hover:text-zinc-400' href={`#${slug}`}>
        {text}
      </a>
    </li>
  )
}

const DEPTH_STYLE = {
  3: 'pl-4',
  4: 'pl-8'
}

const NestedHeading = ({ headings }: { headings: MarkdownHeading[] }) => {
  return (
    <ul
      className={cn(
        'mt-2 space-y-2',
        DEPTH_STYLE[headings[0].depth as keyof typeof DEPTH_STYLE]
      )}
    >
      {headings.map((heading) => (
        <Heading key={heading.slug} {...heading} />
      ))}
    </ul>
  )
}

const TableOfContent = ({ headings, className }: Props) => {
  const groupedHeadings = groupHeadings(headings)

  return (
    <div className={cn('font-secondary', className)}>
      <p className='font-display text-lg font-semibold text-zinc-200'>
        On this page
      </p>
      <ul
        className={cn(
          'mt-2 space-y-1.5 text-[0.9rem] text-zinc-600',
          'scrollbar-color max-h-[480px] overflow-y-scroll'
        )}
      >
        {groupedHeadings.map((heading) => {
          if (!Array.isArray(heading)) {
            return <Heading key={heading.slug} {...heading} />
          }

          return (
            <NestedHeading
              key={`${heading[0].slug}-${heading[0].depth}`}
              headings={heading}
            />
          )
        })}
      </ul>
    </div>
  )
}

export default TableOfContent
