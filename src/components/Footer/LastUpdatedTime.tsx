import useSWR from 'swr'

import client from '@/lib/client'
import { fetcher, formatDateByTimeZone } from '@/lib/utils'

interface Props {
  class?: string
}

const LastUpdatedTime = ({ class: className }: Props) => {
  const { data } = useSWR(
    'last-updated',
    fetcher(() =>
      client.api.github['repo-info'][':owner'][':repository'].$get({
        param: { owner: 'sylvaincostes', repository: 'portfolio-ouiok' }
      })
    )
  )

  if (!data) return null

  const formattedDate = formatDateByTimeZone(new Date(data.pushedAt))

  return (
    <p className={`text-xs min-[961px]:self-end ${className ?? ''}`}>
      Last updated by Sylvain <br className='xs:hidden' /> on {formattedDate}
    </p>
  )
}

export default LastUpdatedTime
