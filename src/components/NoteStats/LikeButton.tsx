import { Drawer, DrawerContent, DrawerOverlay } from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { createReactionDraftEvent } from '@/lib/draft-event'
import { cn } from '@/lib/utils'
import { useNostr } from '@/providers/NostrProvider'
import { useNoteStats } from '@/providers/NoteStatsProvider'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import { Loader, SmilePlus } from 'lucide-react'
import { Event } from 'nostr-tools'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Emoji from '../Emoji'
import EmojiPicker from '../EmojiPicker'
import SuggestedEmojis from '../SuggestedEmojis'

export default function LikeButton({ event }: { event: Event }) {
  const { t } = useTranslation()
  const { isSmallScreen } = useScreenSize()
  const { pubkey, publish, checkLogin } = useNostr()
  const { noteStatsMap, updateNoteStatsByEvents, fetchNoteStats } = useNoteStats()
  const [liking, setLiking] = useState(false)
  const [isEmojiReactionsOpen, setIsEmojiReactionsOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const myLastEmoji = useMemo(() => {
    const stats = noteStatsMap.get(event.id) || {}
    const like = stats.likes?.find((like) => like.pubkey === pubkey)
    return like?.emoji
  }, [noteStatsMap, event, pubkey])

  const like = async (emoji: string) => {
    checkLogin(async () => {
      if (liking || !pubkey) return

      setLiking(true)
      const timer = setTimeout(() => setLiking(false), 5000)

      try {
        const noteStats = noteStatsMap.get(event.id)
        if (!noteStats?.updatedAt) {
          await fetchNoteStats(event)
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
        !myLastEmoji ? 'text-muted-foreground' : ''
      )}
      title={t('Like')}
      onClick={() => {
        if (isSmallScreen) {
          setIsEmojiReactionsOpen(true)
        }
      }}
    >
      {liking ? (
        <Loader className="animate-spin" />
      ) : myLastEmoji ? (
        <Emoji emoji={myLastEmoji} className="h-5 w-5 flex items-center" />
      ) : (
        <SmilePlus />
      )}
    </button>
  )

  if (isSmallScreen) {
    return (
      <>
        {trigger}
        <Drawer open={isEmojiReactionsOpen} onOpenChange={setIsEmojiReactionsOpen}>
          <DrawerOverlay onClick={() => setIsEmojiReactionsOpen(false)} />
          <DrawerContent hideOverlay>
            <EmojiPicker
              onEmojiClick={(data) => {
                setIsEmojiReactionsOpen(false)
                like(data.emoji)
              }}
            />
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <DropdownMenu
      open={isEmojiReactionsOpen}
      onOpenChange={(open) => {
        setIsEmojiReactionsOpen(open)
        if (open) {
          setIsPickerOpen(false)
        }
      }}
    >
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent side="top" className="p-0 w-fit">
        {isPickerOpen ? (
          <EmojiPicker
            onEmojiClick={(data, e) => {
              e.stopPropagation()
              setIsEmojiReactionsOpen(false)
              like(data.emoji)
            }}
          />
        ) : (
          <SuggestedEmojis
            onEmojiClick={(emoji) => {
              setIsEmojiReactionsOpen(false)
              like(emoji)
            }}
            onMoreButtonClick={() => {
              setIsPickerOpen(true)
            }}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
