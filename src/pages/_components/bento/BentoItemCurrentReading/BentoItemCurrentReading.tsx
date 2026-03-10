import { Book } from '@icons/Book'
import useSWR from 'swr'

import client from '@/lib/client'
import { cn, fetcher } from '@/lib/utils'

import BentoBadge from '../BentoBadge'

interface Props {}

const BentoItemCurrentReading = (_props: Props) => {
    const { data, error } = useSWR(
        'reading',
        fetcher(() => client.api.reading.$get()),
        {
            refreshInterval: 60000
        }
    )

    if (error && !data) return <p>Erreur de chargement</p>

    return (
        <a
            href={data?.bookUrl}
            target='_blank'
            className={cn(
                'group relative flex h-full flex-col gap-y-4 overflow-hidden rounded-3xl p-5',
                'max-lg:p-6'
            )}
        >
            <BentoBadge
                icon={Book}
                text={data?.isReading ? 'Currently Reading' : 'Last Read'}
                className={{
                    component: 'absolute right-3 top-3',
                    icon: 'transition-all duration-300 group-hover:text-emerald-400'
                }}
            />

            <div className='flex items-start gap-x-4 pt-8'>
                {/* Couverture du livre */}
                <div className='relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg shadow-lg'>
                    <img
                        src={data?.coverUrl}
                        alt={data?.title}
                        className='absolute inset-0 h-full w-full object-cover'
                    />
                </div>

                {/* Infos du livre */}
                <div className='flex-1 space-y-2 overflow-hidden'>
                    <p className='line-clamp-2 font-semibold leading-tight'>
                        {data?.title}
                    </p>
                    <p className='text-sm text-slate-400'>
                        {data?.author}
                    </p>

                    {/* Barre de progression */}
                    <div className='space-y-1'>
                        <div className='flex items-center justify-between text-xs text-slate-400'>
                            <span>Progress</span>
                            <span>{data?.progress}%</span>
                        </div>
                        <div className='h-2 w-full overflow-hidden rounded-full bg-slate-700'>
                            <div
                                className='h-full rounded-full bg-emerald-400 transition-all duration-500'
                                style={{ width: `${data?.progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Citation */}
            {data?.quote && (
                <div className='mt-auto rounded-lg border border-slate-700 bg-slate-800/50 p-3'>
                    <p className='text-sm italic text-slate-300'>
                        "{data.quote}"
                    </p>
                </div>
            )}
        </a>
    )
}

export default BentoItemCurrentReading
