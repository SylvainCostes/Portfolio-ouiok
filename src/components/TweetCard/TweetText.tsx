import { type EnrichedTweet } from 'react-tweet'

import TweetLink from './TweetLink'

interface Props {
  tweet: EnrichedTweet
}

const TweetText = ({ tweet }: Props) => {
  return (
    <div className='mb-2 mt-4 truncate whitespace-pre-wrap text-[15px] text-zinc-200'>
      {tweet.entities.map((item, i) => {
        switch (item.type) {
          case 'hashtag':
          case 'mention':
          case 'url':
          case 'symbol':
            return (
              <TweetLink key={i} href={item.href}>
                {item.text}
              </TweetLink>
            )
          case 'media':
            return
          default:
            // We use `dangerouslySetInnerHTML` to preserve the text encoding.
            // https://github.com/vercel-labs/react-tweet/issues/29
            return (
              <span key={i} dangerouslySetInnerHTML={{ __html: item.text }} />
            )
        }
      })}
    </div>
  )
}

export default TweetText
