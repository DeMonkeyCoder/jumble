import { Drawer, DrawerContent, DrawerOverlay } from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import { useState } from 'react'
import EmojiPicker from '../EmojiPicker'
import SuggestedEmojis from './SuggestedEmojis'

export default function EmojiReactions({
  children,
  onEmojiClick
}: {
  children: React.ReactNode
  onEmojiClick: (emoji: string) => void
}) {
  const { isSmallScreen } = useScreenSize()
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  if (isSmallScreen) {
    return (
      <>
        <Popover
          open={isPopoverOpen}
          onOpenChange={(open) => {
            setIsPopoverOpen(open)
            if (open) {
              setIsPickerOpen(false)
            }
          }}
        >
          <PopoverTrigger asChild>{children}</PopoverTrigger>
          <PopoverContent className="p-1 rounded-lg w-fit">
            <SuggestedEmojis
              onEmojiClick={(emoji) => {
                setIsPopoverOpen(false)
                onEmojiClick(emoji)
              }}
              onMoreButtonClick={() => {
                setIsPopoverOpen(false)
                setIsPickerOpen(true)
              }}
            />
          </PopoverContent>
        </Popover>
        <Drawer open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <DrawerOverlay onClick={() => setIsPickerOpen(false)} />
          <DrawerContent hideOverlay>
            <EmojiPicker
              onEmojiClick={(data) => {
                setIsPickerOpen(false)
                onEmojiClick(data.emoji)
              }}
            />
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <Popover
      open={isPopoverOpen}
      onOpenChange={(open) => {
        setIsPopoverOpen(open)
        if (open) {
          setIsPickerOpen(false)
        }
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="p-1 rounded-lg w-fit">
        {isPickerOpen ? (
          <EmojiPicker
            onEmojiClick={(data, e) => {
              e.stopPropagation()
              setIsPopoverOpen(false)
              onEmojiClick(data.emoji)
            }}
          />
        ) : (
          <SuggestedEmojis
            onEmojiClick={(emoji) => {
              setIsPopoverOpen(false)
              onEmojiClick(emoji)
            }}
            onMoreButtonClick={() => {
              setIsPickerOpen(true)
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
