import { cn } from '@/lib/utils'
import NsfwOverlay from '../NsfwOverlay'
import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || !document.pictureInPictureEnabled) return

    const observer = new IntersectionObserver(
      async ([entry]) => {
        try {
          if (!entry.isIntersecting && !document.pictureInPictureElement) {
            if (!videoEl.paused) {
              await videoEl.requestPictureInPicture()
            }
          } else if (entry.isIntersecting && document.pictureInPictureElement === videoEl) {
            await document.exitPictureInPicture()
          }
        } catch (err) {
          console.error('PIP error', err)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(videoEl)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
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
  )
}
