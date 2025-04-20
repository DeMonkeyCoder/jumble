import { createReactionDraftEvent } from '@/lib/draft-event'
import { cn } from '@/lib/utils'
import { useNostr } from '@/providers/NostrProvider'
import { useNoteStats } from '@/providers/NoteStatsProvider'
import { Loader, SmilePlus } from 'lucide-react'
import { Event } from 'nostr-tools'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import EmojiReactions from '../EmojiReactions'

export default function LikeButton({ event }: { event: Event }) {
  const { t } = useTranslation()
  const { pubkey, publish, checkLogin } = useNostr()
  const { noteStatsMap, updateNoteStatsByEvents, fetchNoteStats } = useNoteStats()
  const [liking, setLiking] = useState(false)
  const reactionContent = useMemo(() => {
    const stats = noteStatsMap.get(event.id) || {}
    const reactions = pubkey ? Array.from(stats.likes?.get(pubkey)?.values() || []) : []
    return reactions[0] as string | undefined
  }, [noteStatsMap, event, pubkey])

  const like = async (emoji: string) => {
    checkLogin(async () => {
      if (liking || !pubkey) return

      setLiking(true)
      const timer = setTimeout(() => setLiking(false), 5000)

      try {
        const noteStats = noteStatsMap.get(event.id)
        const hasLiked = noteStats?.likes?.has(pubkey)
        if (hasLiked) return
        if (!noteStats?.updatedAt) {
          const stats = await fetchNoteStats(event)
          if (stats?.likes?.has(pubkey)) return
        }

        const reaction = createReactionDraftEvent(event, emoji)
        const evt = await publish(reaction)
        updateNoteStatsByEvents([evt])
      } catch (error) {
        console.error('like failed', error)
      } finally {
        setLiking(false)
        clearTimeout(timer)
      }
    })
  }

  const trigger = (
    <button
      className={cn(
        'flex items-center enabled:hover:text-primary gap-1 px-3 h-full',
        !reactionContent ? 'text-muted-foreground' : ''
      )}
      title={t('Like')}
    >
      {liking ? (
        <Loader className="animate-spin" />
      ) : reactionContent ? (
        <div className="h-5 flex items-center">{reactionContent}</div>
      ) : (
        <SmilePlus />
      )}
    </button>
  )

  return <EmojiReactions onEmojiClick={like}>{trigger}</EmojiReactions>
}
