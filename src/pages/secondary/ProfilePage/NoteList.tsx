import NoteCard, { NoteCardLoadingSkeleton } from '@/components/NoteCard'
import { PictureNoteCardMasonry } from '@/components/PictureNoteCardMasonry'
import { ShowNewButton } from '@/components/ShowNewButton'
import TabSwitcher from '@/components/TabSwitch'
import { Button } from '@/components/ui/button'
import { BIG_RELAY_URLS, ExtendedKind } from '@/constants'
import { isReplyNoteEvent } from '@/lib/event'
import { useNostr } from '@/providers/NostrProvider'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import client from '@/services/client.service'
import dayjs from 'dayjs'
import { Event, kinds } from 'nostr-tools'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PullToRefresh from 'react-simple-pull-to-refresh'

type TNoteListMode = 'posts' | 'postsAndReplies' | 'pictures' | 'mutual'

const LIMIT = 100
const SHOW_COUNT = 10

export default function NoteList({ author, className }: { author: string; className?: string }) {
  const { t } = useTranslation()
  const { isLargeScreen } = useScreenSize()
  const { pubkey, startLogin } = useNostr()
  const [refreshCount, setRefreshCount] = useState(0)
  const [timelineKey, setTimelineKey] = useState<string | undefined>(undefined)
  const [events, setEvents] = useState<Event[]>([])
  const [newEvents, setNewEvents] = useState<Event[]>([])
  const [showCount, setShowCount] = useState(SHOW_COUNT)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const [listMode, setListMode] = useState<TNoteListMode>('posts')
  const [filterType, setFilterType] = useState<Exclude<TNoteListMode, 'postsAndReplies'>>('posts')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const topRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    switch (listMode) {
      case 'posts':
      case 'postsAndReplies':
        setFilterType('posts')
        break
      case 'pictures':
        setFilterType('pictures')
        break
      case 'mutual':
        if (!pubkey || pubkey === author) {
          setFilterType('posts')
        } else {
          setFilterType('mutual')
        }
        break
    }
  }, [listMode, pubkey])

  useEffect(() => {
    async function init() {
      setLoading(true)
      setEvents([])
      setNewEvents([])
      setHasMore(true)

      const subRequests: any[] = []
      if (filterType === 'mutual' && pubkey && pubkey !== author) {
        const [myRelayList, targetRelayList] = await Promise.all([
          client.fetchRelayList(pubkey),
          client.fetchRelayList(author)
        ])
        subRequests.push({
          urls: myRelayList.write.concat(BIG_RELAY_URLS).slice(0, 5),
          filter: {
            kinds: [kinds.ShortTextNote, kinds.Repost],
            authors: [pubkey],
            '#p': [author],
            limit: LIMIT
          }
        })
        subRequests.push({
          urls: targetRelayList.write.concat(BIG_RELAY_URLS).slice(0, 5),
          filter: {
            kinds: [kinds.ShortTextNote, kinds.Repost],
            authors: [author],
            '#p': [pubkey],
            limit: LIMIT
          }
        })
      } else {
        const relayList = await client.fetchRelayList(author)
        subRequests.push({
          urls: relayList.write.concat(BIG_RELAY_URLS).slice(0, 5),
          filter: {
            kinds:
              filterType === 'pictures'
                ? [ExtendedKind.PICTURE]
                : [kinds.ShortTextNote, kinds.Repost],
            authors: [author],
            limit: LIMIT
          }
        })
      }

      const { closer, timelineKey } = await client.subscribeTimeline(
        subRequests,
        {
          onEvents: (events, eosed) => {
            if (events.length > 0) {
              setEvents(events)
            }
            if (eosed) {
              setLoading(false)
              setHasMore(events.length > 0)
            }
          },
          onNew: (event) => {
            setNewEvents((oldEvents) =>
              [event, ...oldEvents].sort((a, b) => b.created_at - a.created_at)
            )
          }
        },
        { startLogin }
      )
      setTimelineKey(timelineKey)
      return closer
    }

    const promise = init()
    return () => {
      promise.then((closer) => closer())
    }
  }, [filterType, refreshCount])

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '10px',
      threshold: 0.1
    }

    const loadMore = async () => {
      if (showCount < events.length) {
        setShowCount((prev) => prev + SHOW_COUNT)
        // preload more
        if (events.length - showCount > LIMIT / 2) {
          return
        }
      }

      if (!timelineKey || loading || !hasMore) return
      setLoading(true)
      const newEvents = await client.loadMoreTimeline(
        timelineKey,
        events.length ? events[events.length - 1].created_at - 1 : dayjs().unix(),
        LIMIT
      )
      setLoading(false)
      if (newEvents.length === 0) {
        setHasMore(false)
        return
      }
      setEvents((oldEvents) => [...oldEvents, ...newEvents])
    }

    const observerInstance = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    }, options)

    const currentBottomRef = bottomRef.current

    if (currentBottomRef) {
      observerInstance.observe(currentBottomRef)
    }

    return () => {
      if (observerInstance && currentBottomRef) {
        observerInstance.unobserve(currentBottomRef)
      }
    }
  }, [timelineKey, loading, hasMore, events, author, showCount])

  const showNewEvents = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    setEvents((oldEvents) => [...newEvents, ...oldEvents])
    setNewEvents([])
  }

  return (
    <div className={className}>
      <TabSwitcher
        value={listMode}
        tabs={
          pubkey && pubkey !== author
            ? [
                { value: 'posts', label: 'Notes' },
                { value: 'postsAndReplies', label: 'Replies' },
                { value: 'pictures', label: 'Pictures' },
                { value: 'mutual', label: 'Mutual' }
              ]
            : [
                { value: 'posts', label: 'Notes' },
                { value: 'postsAndReplies', label: 'Replies' },
                { value: 'pictures', label: 'Pictures' }
              ]
        }
        onTabChange={(listMode) => {
          setListMode(listMode as TNoteListMode)
          setShowCount(SHOW_COUNT)
          topRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' })
        }}
      />
      <div ref={topRef} />
      {events.length > 0 &&
        newEvents.filter((event: Event) => {
          return listMode !== 'posts' || !isReplyNoteEvent(event)
        }).length > 0 && <ShowNewButton onClick={showNewEvents} />}
      <PullToRefresh
        onRefresh={async () => {
          setRefreshCount((count) => count + 1)
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }}
        pullingContent=""
      >
        <div>
          {listMode === 'pictures' ? (
            <PictureNoteCardMasonry
              className="px-2 sm:px-4 mt-2"
              columnCount={isLargeScreen ? 3 : 2}
              events={events.slice(0, showCount)}
            />
          ) : (
            <div>
              {events
                .slice(0, showCount)
                .filter((event: Event) => listMode !== 'posts' || !isReplyNoteEvent(event))
                .map((event) => (
                  <NoteCard
                    key={event.id}
                    className="w-full"
                    event={event}
                    filterMutedNotes={false}
                  />
                ))}
            </div>
          )}
          {hasMore || loading ? (
            <div ref={bottomRef}>
              <NoteCardLoadingSkeleton isPictures={listMode === 'pictures'} />
            </div>
          ) : events.length ? (
            <div className="text-center text-sm text-muted-foreground mt-2">
              {t('no more notes')}
            </div>
          ) : (
            <div className="flex justify-center w-full mt-2">
              <Button size="lg" onClick={() => setRefreshCount((pre) => pre + 1)}>
                {t('reload notes')}
              </Button>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}
