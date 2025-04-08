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

  // Detact screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.length < 500)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // This is used to control when the floating PiP should activate.
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const handlePlay = () => setHasPlayed(true)
    videoEl.addEventListener('play', handlePlay)

    return () => {
      videoEl.removeEventListener('play', handlePlay)
    }
  }, [])

  // ⏸️ When the floating PiP player is shown,
  // pause the main video to prevent both players from playing simultaneously.
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    if (showFloatingPlayer && !videoEl.paused) {
      videoEl.pause()
    }
  }, [showFloatingPlayer])

  // Observe video in viewport
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && hasPlayed && !videoEl.paused) {
          setShowFloatingPlayer(true)
        } else {
          setShowFloatingPlayer(false)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(videoEl)

    return () => observer.disconnect()
  }, [hasPlayed])

  // Floating video to continue from where the main video stopped
  useEffect(() => {
    const mainVideo = videoRef.current
    const floatingVideo = floatingVideoRef.current

    if (!mainVideo || !floatingVideo) return

    if (showFloatingPlayer) {
      const currentTime = mainVideo.currentTime
      mainVideo.pause()

      // Sync time and play floating
      floatingVideo.currentTime = currentTime
      floatingVideo.play().catch(console.error)
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
