import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useNoteStats } from '@/providers/NoteStatsProvider'
import { Event } from 'nostr-tools'
import { useMemo } from 'react'
import Emoji from '../Emoji'

export default function Likes({ event }: { event: Event }) {
  const { noteStatsMap } = useNoteStats()
  const likes = useMemo(() => {
    const _likes = noteStatsMap.get(event.id)?.likes
    if (!_likes) return []

    const stats = new Map<string, Set<string>>()
    _likes.forEach((map, pubkey) => {
      map.forEach((content) => {
        if (!stats.has(content)) {
          stats.set(content, new Set())
        }
        stats.get(content)?.add(pubkey)
      })
    })
    return Array.from(stats.entries()).sort(([, a], [, b]) => b.size - a.size)
  }, [noteStatsMap, event])

  if (!likes.length) return null

  return (
    <ScrollArea className="pb-2 mb-1">
      <div className="flex gap-1">
        {likes.map(([content, pubkeys]) => (
          <div
            key={content}
            className="flex gap-2 px-2 text-muted-foreground rounded-full bg-muted items-center cursor-pointer border hover:bg-primary/40 hover:border-primary hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <Emoji emoji={content} />
            <div className="text-sm">{pubkeys.size}</div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
