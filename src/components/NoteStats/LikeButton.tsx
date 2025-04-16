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
import { useTheme } from '@/providers/ThemeProvider'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { Loader, SmilePlus } from 'lucide-react'
import { Event } from 'nostr-tools'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function LikeButton({ event }: { event: Event }) {
  const { t } = useTranslation()
  const { themeSetting } = useTheme()
  const { isSmallScreen } = useScreenSize()
  const { pubkey, publish, checkLogin } = useNostr()
  const { noteStatsMap, updateNoteStatsByEvents, fetchNoteStats } = useNoteStats()
  const [liking, setLiking] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const reactionContent = useMemo(() => {
    const stats = noteStatsMap.get(event.id) || {}
    const reactions = pubkey ? Array.from(stats.likes?.get(pubkey)?.values() || []) : []
    return reactions[0] as string | undefined
  }, [noteStatsMap, event, pubkey])
  const canLike = !reactionContent && !liking

  const like = async (emoji: string) => {
    checkLogin(async () => {
      if (!canLike || !pubkey) return

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
        'flex items-center enabled:hover:text-red-400 gap-1 px-3 h-full',
        !reactionContent ? 'text-muted-foreground' : ''
      )}
      onClick={() => {
        if (isSmallScreen) {
          setIsDrawerOpen(true)
        }
      }}
      disabled={!canLike}
      title={t('Like')}
    >
      {liking ? (
        <Loader className="animate-spin" />
      ) : reactionContent ? (
        <div className="h-5">{reactionContent}</div>
      ) : (
        <SmilePlus />
      )}
    </button>
  )

  const emojiPicker = (
    <EmojiPicker
      theme={
        themeSetting === 'system' ? Theme.AUTO : themeSetting === 'dark' ? Theme.DARK : Theme.LIGHT
      }
      width={isSmallScreen ? '100%' : 350}
      autoFocusSearch={false}
      lazyLoadEmojis
      searchDisabled
      style={
        {
          '--epr-bg-color': 'hsl(var(--background))',
          '--epr-category-label-bg-color': 'hsl(var(--background))',
          '--epr-text-color': 'hsl(var(--foreground))',
          '--epr-hover-bg-color': 'hsl(var(--muted) / 0.5)',
          '--epr-picker-border-color': 'transparent'
        } as React.CSSProperties
      }
      onEmojiClick={(data, event) => {
        event.stopPropagation()
        like(data.emoji)
      }}
    />
  )

  if (isSmallScreen) {
    return (
      <>
        {trigger}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerOverlay onClick={() => setIsDrawerOpen(false)} />
          <DrawerContent hideOverlay>
            <div className="py-2">{emojiPicker}</div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="p-0">{emojiPicker}</DropdownMenuContent>
    </DropdownMenu>
  )
}
