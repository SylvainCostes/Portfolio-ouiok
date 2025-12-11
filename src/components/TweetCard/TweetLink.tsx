import React from 'react'

interface Props {
  href: string
  children: React.ReactNode
}

const TweetLink = ({ children, href }: Props) => {
  return (
    <a
      className='font-normal text-[rgb(29,161,242)] no-underline'
      href={href}
      target='_blank'
      rel='noopener noreferrer'
    >
      {children}
    </a>
  )
}

export default TweetLink
