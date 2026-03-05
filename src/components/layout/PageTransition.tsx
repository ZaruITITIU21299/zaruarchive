import { useEffect, useState, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import type { Location } from 'react-router-dom'

const TRANSITIONS = [
  { enter: 'animate-fadeSlideUp', exit: 'animate-fadeSlideDown' },
  { enter: 'animate-fadeSlideLeft', exit: 'animate-fadeSlideRight' },
  { enter: 'animate-fadeScale', exit: 'animate-fadeScaleOut' },
  { enter: 'animate-fadeBlur', exit: 'animate-fadeBlurOut' },
] as const

function pickRandom() {
  return TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)]
}

interface PageTransitionResult {
  displayLocation: Location
  animClass: string
  transitioning: boolean
}

/**
 * Returns a frozen `displayLocation` that stays on the old route during
 * the exit animation, then switches to the real location for the enter.
 * Pass `displayLocation` to `<Routes location={displayLocation}>`.
 */
export function usePageTransition(): PageTransitionResult {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [animClass, setAnimClass] = useState('animate-fadeSlideUp')
  const [transitioning, setTransitioning] = useState(false)
  const prevPathRef = useRef(location.pathname)
  const latestLocationRef = useRef(location)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  latestLocationRef.current = location

  const runTransition = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const picked = pickRandom()
    setTransitioning(true)
    setAnimClass(picked.exit)

    timeoutRef.current = setTimeout(() => {
      setDisplayLocation(latestLocationRef.current)
      setAnimClass(picked.enter)
      setTransitioning(false)
    }, 200)
  }, [])

  useEffect(() => {
    if (location.pathname === prevPathRef.current) {
      setDisplayLocation(location)
      return
    }
    prevPathRef.current = location.pathname
    runTransition()
  }, [location.pathname, runTransition])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { displayLocation, animClass, transitioning }
}
