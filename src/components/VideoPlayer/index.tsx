import { cn } from '@/lib/utils'
import NsfwOverlay from '../NsfwOverlay'
import { useEffect, useRef, useState } from 'react'
import CloseIcon from '../ui/closeicon'

export default function VideoPlayer({
  src,
  className,
  isNsfw = false,
  size = 'normal'
}: {
  src: string
  className?: string
  isNsfw?: boolean
  size?: 'normal' | 'small'
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const floatingVideoRef = useRef<HTMLVideoElement>(null)

  const [showFloatingPlayer, setShowFloatingPlayer] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  // 🧠 Everything except PiP video syncing goes here
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    // Screen size detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 500)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Set hasPlayed on user-initiated play
    const handlePlay = () => setHasPlayed(true)
    videoEl.addEventListener('play', handlePlay)

    // Observe video visibility in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldFloat = !entry.isIntersecting && hasPlayed && !videoEl.paused
        setShowFloatingPlayer(shouldFloat)

        // If video returns to view and PiP was active, sync back
        const floating = floatingVideoRef.current
        if (entry.isIntersecting && floating && !floating.paused) {
          videoEl.currentTime = floating.currentTime
          floating.pause()
          videoEl.play().catch(console.error)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(videoEl)

    return () => {
      window.removeEventListener('resize', checkMobile)
      videoEl.removeEventListener('play', handlePlay)
      observer.disconnect()
    }
  }, [hasPlayed])

  // 🎬 Sync floating video when PiP is triggered
  useEffect(() => {
    const mainVideo = videoRef.current
    const floating = floatingVideoRef.current
    if (!mainVideo || !floating) return

    if (showFloatingPlayer) {
      const time = mainVideo.currentTime
      mainVideo.pause()
      floating.currentTime = time
      floating.play().catch(console.error)
    }
  }, [showFloatingPlayer])



  return (
    <>
      <div className="relative">
        <video
          ref={videoRef}
          controls
          className={cn('rounded-lg', size === 'small' ? 'h-[15vh]' : 'h-[30vh]', className)}
          src={src}
          onClick={(e) => e.stopPropagation()}
        />
        {isNsfw && <NsfwOverlay className="rounded-lg" />}
      </div>

      {/* ===>=== FLOATING PIP-STYLE PLAYER */}
      {showFloatingPlayer && (
        <div
          className={cn(
            'fixed z-20  bottom-4 right-4 shadow-xl rounded-md overflow-hidden w-[300px]',
            !isMobile ? 'bottom-2 right-2' : 'bottom-4 right-4 w-[300px]'
          )}
        >
          {' '}
          <div className="">
            <video
              ref={floatingVideoRef}
              src={src}
              autoPlay
              controls
              className="relative rounded-md"
            />
          </div>
          <button
            onClick={() => setShowFloatingPlayer(false)}
            className="absolute top-7 right-3 bg-black/50 z-50 text-white rounded-full w-[25px] h-[25px] flex items-center justify-center"
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </>
  )
}
