import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useNoteStats } from '@/providers/NoteStatsProvider'
import { Event } from 'nostr-tools'
import { useMemo } from 'react'

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
            className="flex gap-1 py-1 pl-1 pr-2 text-sm rounded-full bg-muted items-center text-yellow-400 clickable"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div>{content}</div>
            <div className="text-sm">{pubkeys.size}</div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
