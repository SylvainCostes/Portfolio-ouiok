import React from 'react'

import { cn } from '@/lib/utils'

import { Play } from '../icons/Play'

interface Props {
  src: string
  poster?: string
}

const TweetVideo = ({ src, poster }: Props) => {
  const [playButton, setPlayButton] = React.useState(true)

  return (
    <div className='relative'>
      <video
        className='max-h-[640px] rounded-lg border border-zinc-700 drop-shadow-sm'
        height='640px'
        controls={!playButton}
        poster={poster}
        loop
        muted
        playsInline
      >
        <source src={src} type='video/mp4' />
        Your browser does not support the video tag.
      </video>
      {playButton && (
        <button
          type='button'
          aria-label='View video on X'
          className={cn(
            'absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2',
            'items-center justify-center rounded-full bg-sky-500 p-2.5',
            'border-[2.5px] border-zinc-50'
          )}
          onClick={(e) => {
            const video = e.currentTarget.previousSibling as HTMLMediaElement

            e.preventDefault()
            setPlayButton(false)
            video.play()
            video.focus()
          }}
        >
          <Play className='size-full text-zinc-50' />
        </button>
      )}
    </div>
  )
}

export default TweetVideo
