import { cn } from '@/lib/utils'
import NsfwOverlay from '../NsfwOverlay'
import { useEffect, useRef } from 'react'
// import CloseIcon from '../ui/closeicon'

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

  // Observe video in viewport
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || !document.pictureInPictureEnabled) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentPip = document.pictureInPictureElement === videoEl

        if (!entry.isIntersecting) {
          // Only trigger PiP if it's this video and not already in PiP
          if (!videoEl.paused && !isCurrentPip) {
            videoEl.requestPictureInPicture().catch(console.error)
          }
        } else {
          // If scrolled back and it's this video in PiP, close PiP
          if (isCurrentPip) {
            document.exitPictureInPicture().catch(console.error)
          }
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(videoEl)

    return () => observer.disconnect()
  }, [])

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
    </>
  )
}
