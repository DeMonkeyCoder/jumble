import {
  EmbeddedHashtagParser,
  EmbeddedMentionParser,
  EmbeddedNormalUrlParser,
  EmbeddedRelayParser,
  parseContent
} from '@/lib/content-parser'
import { useMemo } from 'react'
import {
  EmbeddedHashtag,
  EmbeddedMention,
  EmbeddedNormalUrl,
  EmbeddedWebsocketUrl
} from '../Embedded'

export default function ProfileAbout({ about, className }: { about?: string; className?: string }) {
  const aboutNodes = useMemo(() => {
    if (!about) return null

    const nodes = parseContent(about, [
      EmbeddedRelayParser,
      EmbeddedNormalUrlParser,
      EmbeddedHashtagParser,
      EmbeddedMentionParser
    ])
    return nodes.map((node, index) => {
      if (node.type === 'text') {
        return node.data
      }
      if (node.type === 'url') {
        return <EmbeddedNormalUrl key={`embedded-url-${index}-${node.data}`} url={node.data} />
      }
      if (node.type === 'relay') {
        return <EmbeddedWebsocketUrl key={`embedded-relay-${index}-${node.data}`} url={node.data} />
      }
      if (node.type === 'hashtag') {
        return (
          <EmbeddedHashtag key={`embedded-hashtag-${index}-${node.data}`} hashtag={node.data} />
        )
      }
      if (node.type === 'mention') {
        return (
          <EmbeddedMention
            key={`embedded-nostr-profile-${index}-${node.data}`}
            userId={node.data.split(':')[1]}
          />
        )
      }
    })
  }, [about])

  return <div className={className}>{aboutNodes}</div>
}
