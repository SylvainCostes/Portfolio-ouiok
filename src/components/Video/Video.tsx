import React from 'react'

import { Play } from '../icons/Play'

interface Props extends React.VideoHTMLAttributes<HTMLVideoElement> {}

const Video = ({ src, ...props }: Props) => {
  const [playButton, setPlayButton] = React.useState(true)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const video = e.currentTarget.previousSibling as HTMLMediaElement

    e.preventDefault()
    setPlayButton(false)
    video.play()
    video.focus()
  }

  return (
    <div className='relative'>
      <video {...props} controls={!playButton}>
        <source src={src} type='video/mp4' />
        Your browser does not support the video tag.
      </video>
      {playButton && (
        <button
          type='button'
          aria-label='Play video'
          className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          onClick={handleClick}
        >
          <Play className='size-16' />
        </button>
      )}
    </div>
  )
}

export default Video
