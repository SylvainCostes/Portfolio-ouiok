import useSWR from 'swr'

import client from '@/lib/client'
import { fetcher, formatDateByTimeZone } from '@/lib/utils'

interface Props {
  filePath: string
  class?: string
}

const LastUpdatedFile = ({ filePath, class: className }: Props) => {
  const { data } = useSWR(
    ['last-updated-file', filePath],
    fetcher(() =>
      client.api.github['last-updated-file'].$get({ query: { path: filePath } })
    )
  )

  if (!data) return null

  return (
    <p className={`!mt-8 text-zinc-500 ${className ?? ''}`}>
      Last updated on {formatDateByTimeZone(new Date(data.lastUpdatedTime))} UTC+7.
      {data.latestCommitUrl && (
        <a
          href={data.latestCommitUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='underline underline-offset-2 hover:text-zinc-300'
        >
          See Changelog
        </a>
      )}
    </p>
  )
}

export default LastUpdatedFile
