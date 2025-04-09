import {
  EmbeddedEventParser,
  EmbeddedHashtagParser,
  EmbeddedImageParser,
  EmbeddedMentionParser,
  EmbeddedNormalUrlParser,
  EmbeddedRelayParser,
  EmbeddedVideoParser,
  parseContent
} from '@/lib/content-parser'
import { isNsfwEvent } from '@/lib/event'
import { extractImageInfoFromTag } from '@/lib/tag'
import { cn } from '@/lib/utils'
import { TImageInfo } from '@/types'
import { Event } from 'nostr-tools'
import { memo } from 'react'
import {
  EmbeddedHashtag,
  EmbeddedMention,
  EmbeddedNormalUrl,
  EmbeddedNote,
  EmbeddedWebsocketUrl
} from '../Embedded'
import ImageGallery from '../ImageGallery'
import VideoPlayer from '../VideoPlayer'

const Content = memo(
  ({
    event,
    className,
    size = 'normal'
  }: {
    event: Event
    className?: string
    size?: 'normal' | 'small'
  }) => {
    const nodes = parseContent(event.content, [
      EmbeddedImageParser,
      EmbeddedVideoParser,
      EmbeddedNormalUrlParser,
      EmbeddedRelayParser,
      EmbeddedEventParser,
      EmbeddedMentionParser,
      EmbeddedHashtagParser
    ])

    const imageInfos = event.tags
      .map((tag) => extractImageInfoFromTag(tag))
      .filter(Boolean) as TImageInfo[]

    return (
      <div className={cn('text-wrap break-words whitespace-pre-wrap', className)}>
        {nodes.map((node, index) => {
          if (node.type === 'text') {
            return node.data
          }
          if (node.type === 'image' || node.type === 'images') {
            const imageUrls = Array.isArray(node.data) ? node.data : [node.data]
            const images = imageUrls.map(
              (url) => imageInfos.find((image) => image.url === url) ?? { url }
            )
            return (
              <ImageGallery
                className={`${size === 'small' ? 'mt-1' : 'mt-2'}`}
                key={`image-gallery-${event.id}-${index}`}
                images={images}
                isNsfw={isNsfwEvent(event)}
                size={size}
              />
            )
          }
          if (node.type === 'video') {
            return (
              <VideoPlayer
                className={size === 'small' ? 'mt-1' : 'mt-2'}
                key={`video-${index}-${node.data}`}
                src={node.data}
                isNsfw={isNsfwEvent(event)}
                size={size}
              />
            )
          }
          if (node.type === 'url') {
            return <EmbeddedNormalUrl url={node.data} key={`normal-url-${index}-${node.data}`} />
          }
          if (node.type === 'relay') {
            return (
              <EmbeddedWebsocketUrl url={node.data} key={`websocket-url-${index}-${node.data}`} />
            )
          }
          if (node.type === 'event') {
            const id = node.data.split(':')[1]
            return (
              <EmbeddedNote
                key={`embedded-event-${index}`}
                noteId={id}
                className={size === 'small' ? 'mt-1' : 'mt-2'}
              />
            )
          }
          if (node.type === 'mention') {
            return (
              <EmbeddedMention
                key={`embedded-mention-${index}-${node.data}`}
                userId={node.data.split(':')[1]}
              />
            )
          }
          if (node.type === 'hashtag') {
            return (
              <EmbeddedHashtag hashtag={node.data} key={`embedded-hashtag-${index}-${node.data}`} />
            )
          }
          return null
        })}
      </div>
    )
  }
)
Content.displayName = 'Content'
export default Content
