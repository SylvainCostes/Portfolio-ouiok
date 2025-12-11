import { Monkeytype } from '@icons/Monkeytype'
import { Target } from '@icons/Target'
import { Timer } from '@icons/Timer'
import { Translate } from '@icons/Translate'

import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { MonkeyTypeData, MonkeyTypeLanguage } from '@/types'

import BentoBadge from '../BentoBadge'

const mapTypingDetailData = (data: MonkeyTypeData) => {
  const LANGUAGE: Record<MonkeyTypeLanguage, string> = {
    english: 'EN',
    indonesian: 'ID'
  }
  return [
    { icon: Timer, category: 'time', value: `${data.time}s` },
    { icon: Target, category: 'accuracy', value: `${data.acc}%` },
    { icon: Translate, category: 'language', value: LANGUAGE[data.language] }
  ]
}

interface TypingDetailProps {
  category: string
  value: string
  icon: React.FC<React.SVGProps<SVGSVGElement>>
}

export const TypingDetail = ({
  category,
  icon: Icon,
  value
}: TypingDetailProps) => {
  return (
    <Tooltip className='capitalize' content={category} side='bottom'>
      <div className='flex items-center gap-1 tracking-wider text-slate-200'>
        <Icon className='size-4 text-slate-500 group-hover:text-slate-300' />
        <p>{value}</p>
      </div>
    </Tooltip>
  )
}

interface Props extends MonkeyTypeData { }

const TypingSpeed = (props: Props) => {
  return (
    <a
      href='https://monkeytype.com/profile/LZ5'
      target='_blank'
      className='relative flex h-full flex-col justify-between overflow-hidden rounded-3xl px-5 pb-6 pt-4 max-md:gap-12'
    >
      <p
        className={cn(
          'font-display absolute text-[196px] font-extrabold text-transparent',
          'left-1/2 top-8 -z-10 -translate-x-1/2 leading-none opacity-70',
          'bg-gradient-to-b from-[#1E293B] to-[var(--card-background)] bg-clip-text'
        )}
      >
        {props.wpm}
      </p>
      <BentoBadge
        icon={Monkeytype}
        text='Typing speed'
        className={{ component: 'w-fit' }}
      />
      <div>
        <div className='flex items-baseline'>
          <p className='font-display text-[84px] font-medium leading-tight tracking-normal'>
            {props.wpm}
          </p>
          <p className='ml-2 text-2xl leading-none'>wpm</p>
        </div>
        <div className='flex gap-4'>
          {mapTypingDetailData(props).map((item) => (
            <TypingDetail key={item.category} {...item} />
          ))}
        </div>
      </div>
    </a>
  )
}

export default TypingSpeed
