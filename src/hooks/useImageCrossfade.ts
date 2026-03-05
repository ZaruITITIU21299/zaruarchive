import { useState, useEffect, useRef } from 'react'

/**
 * Cycles through a list of image URLs, returning the current active index.
 * Consumers render all images and toggle opacity based on the index.
 */
export function useImageCrossfade(images: string[] | undefined, intervalMs = 7000) {
  const [activeIndex, setActiveIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)

  useEffect(() => {
    if (!images || images.length <= 1) return

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length)
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [images, intervalMs])

  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  return activeIndex
}
