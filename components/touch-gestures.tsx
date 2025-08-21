"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface TouchGesturesProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPullToRefresh?: () => void
  className?: string
}

export function TouchGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  className = "",
}: TouchGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const isMobile = useIsMobile()

  const minSwipeDistance = 50
  const pullThreshold = 80

  useEffect(() => {
    if (!isMobile) return

    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null)
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return

      const currentTouch = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      }

      // Handle pull-to-refresh
      if (onPullToRefresh && window.scrollY === 0) {
        const deltaY = currentTouch.y - touchStart.y
        if (deltaY > 0) {
          e.preventDefault()
          setIsPulling(true)
          setPullDistance(Math.min(deltaY, pullThreshold * 1.5))
        }
      }

      setTouchEnd(currentTouch)
    }

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return

      const deltaX = touchStart.x - touchEnd.x
      const deltaY = touchStart.y - touchEnd.y

      // Handle pull-to-refresh
      if (isPulling && pullDistance >= pullThreshold && onPullToRefresh) {
        onPullToRefresh()
      }

      // Reset pull state
      setIsPulling(false)
      setPullDistance(0)

      // Handle swipe gestures
      const isLeftSwipe = deltaX > minSwipeDistance
      const isRightSwipe = deltaX < -minSwipeDistance
      const isUpSwipe = deltaY > minSwipeDistance
      const isDownSwipe = deltaY < -minSwipeDistance

      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft()
      } else if (isRightSwipe && onSwipeRight) {
        onSwipeRight()
      } else if (isUpSwipe && onSwipeUp) {
        onSwipeUp()
      } else if (isDownSwipe && onSwipeDown) {
        onSwipeDown()
      }
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [
    touchStart,
    touchEnd,
    isPulling,
    pullDistance,
    isMobile,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPullToRefresh,
  ])

  return (
    <div ref={containerRef} className={className}>
      {/* Pull-to-refresh indicator */}
      {isPulling && onPullToRefresh && (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-primary/10 transition-all duration-200 flex items-center justify-center"
          style={{ height: `${Math.min(pullDistance, pullThreshold)}px` }}
        >
          <div className="text-primary text-sm font-medium">
            {pullDistance >= pullThreshold ? "Release to refresh" : "Pull to refresh"}
          </div>
        </div>
      )}
      {children}
    </div>
  )
}
