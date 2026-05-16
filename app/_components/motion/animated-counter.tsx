"use client"
import { useEffect, useRef } from "react"
import { useInView, animate } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  formatter?: (n: number) => string
  className?: string
}

export function AnimatedCounter({ value, formatter, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || !ref.current) return
    const el = ref.current
    const from = 0
    const controls = animate(from, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        el.textContent = formatter ? formatter(latest) : String(Math.round(latest))
      },
    })
    return () => controls.stop()
  }, [inView, value, formatter])

  return (
    <span ref={ref} className={className}>
      {formatter ? formatter(0) : "0"}
    </span>
  )
}
