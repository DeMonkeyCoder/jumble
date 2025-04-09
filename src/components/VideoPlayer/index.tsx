import { cn } from '@/lib/utils'
import NsfwOverlay from '../NsfwOverlay'
import { useEffect, useRef, useState } from 'react'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import { X } from 'lucide-react'
import VideoManager from '@/utils/VideoManager'

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
  const [hasPlayed, setHasPlayed] = useState(false)
  const { isSmallScreen } = useScreenSize()

  useEffect(() => {
    const videoEl = videoRef.current
    const floating = floatingVideoRef.current
    if (!videoEl) return

    // Track if user started playing the video
    const handlePlay = () => {
      setHasPlayed(true)
      VideoManager.setCurrent(videoEl)

      // Clear existing PiP (other videos)
      VideoManager.clearPiP()
    }

    videoEl.addEventListener('play', handlePlay)

    // Watch visibility of the main video
    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldFloat = !entry.isIntersecting && hasPlayed && !videoEl.paused

        if (shouldFloat) {
          setShowFloatingPlayer(true)

          // Register PiP exit callback
          VideoManager.setPiPCallback(() => {
            setShowFloatingPlayer(false)
            if (floating && !floating.paused) {
              floating.pause()
            }
          })
        } else {
          setShowFloatingPlayer(false)

          // If main video is back in view, sync and resume
          if (entry.isIntersecting && floating && !floating.paused) {
            videoEl.currentTime = floating.currentTime
            floating.pause()
            videoEl.play().catch(console.error)
          }
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(videoEl)

    return () => {
      videoEl.removeEventListener('play', handlePlay)
      VideoManager.clearCurrent(videoEl)
      observer.disconnect()
    }
  }, [hasPlayed])

  // Sync time from main video to floating video
  useEffect(() => {
    const main = videoRef.current
    const floating = floatingVideoRef.current
    if (!main || !floating || !showFloatingPlayer) return

    floating.currentTime = main.currentTime
    main.pause()
    floating.play().catch(console.error)
  }, [showFloatingPlayer])

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
            !isSmallScreen ? 'bottom-2 right-2' : ''
          )}
        >
          <div className="">
            <video
              ref={floatingVideoRef}
              src={src}
              autoPlay
              controls
              className="relative rounded-lg"
            />
          </div>
          <button
            onClick={() => setShowFloatingPlayer(false)}
            className="absolute top-3 right-3 bg-black/50 z-50 text-white rounded-full w-[25px] h-[25px] flex items-center justify-center"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  )
}
