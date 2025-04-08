export type TEmbeddedNodeType =
  | 'text'
  | 'image'
  | 'video'
  | 'event'
  | 'mention'
  | 'hashtag'
  | 'relay'
  | 'url'

export type TEmbeddedNode = {
  type: TEmbeddedNodeType
  content: string
}

type TContentParser = { type: TEmbeddedNodeType; regex: RegExp }

export const EmbeddedHashtagParser: TContentParser = {
  type: 'hashtag',
  regex: /#[\p{L}\p{N}\p{M}_]+/gu
}

export const EmbeddedMentionParser: TContentParser = {
  type: 'mention',
  regex: /nostr:(npub1[a-z0-9]{58}|nprofile1[a-z0-9]+)/g
}

export const EmbeddedLegacyMentionParser: TContentParser = {
  type: 'mention',
  regex: /npub1[a-z0-9]{58}|nprofile1[a-z0-9]+/g
}

export const EmbeddedEventParser: TContentParser = {
  type: 'event',
  regex: /nostr:(note1[a-z0-9]{58}|nevent1[a-z0-9]+|naddr1[a-z0-9]+)/g
}

export const EmbeddedImageParser: TContentParser = {
  type: 'image',
  regex:
    /https?:\/\/[\w\p{L}\p{N}\p{M}&.-/?=#\-@%+_:!~*]+\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg)(\?[^ ]+)?/gu
}

export const EmbeddedVideoParser: TContentParser = {
  type: 'video',
  regex: /https?:\/\/[\w\p{L}\p{N}\p{M}&.-/?=#\-@%+_:!~*]+\.(mp4|webm|ogg|mov)(\?[^ ]+)?/gu
}

export const EmbeddedNormalUrlParser: TContentParser = {
  type: 'url',
  regex: /https?:\/\/[\w\p{L}\p{N}\p{M}&.-/?=#\-@%+_:!~*]+/gu
}

export const EmbeddedRelayParser: TContentParser = {
  type: 'relay',
  regex: /wss?:\/\/[\w\p{L}\p{N}\p{M}&.-/?=#\-@%+_:!~*]+/gu
}

export function parseContent(content: string, parsers: TContentParser[]) {
  let nodes: TEmbeddedNode[] = [{ type: 'text', content }]

  parsers.forEach((parser) => {
    nodes = nodes
      .flatMap((node) => {
        if (node.type !== 'text') return [node]
        const matches = node.content.matchAll(parser.regex)
        const result: TEmbeddedNode[] = []
        let lastIndex = 0
        for (const match of matches) {
          const matchStart = match.index!
          // Add text before the match
          if (matchStart > lastIndex) {
            result.push({
              type: 'text',
              content: node.content.slice(lastIndex, matchStart)
            })
          }

          // Add the match as specific type
          result.push({
            type: parser.type,
            content: match[0] // The whole matched string
          })

          lastIndex = matchStart + match[0].length
        }

        // Add text after the last match
        if (lastIndex < node.content.length) {
          result.push({
            type: 'text',
            content: node.content.slice(lastIndex)
          })
        }

        return result
      })
      .filter((n) => n.content !== '')
  })
}
