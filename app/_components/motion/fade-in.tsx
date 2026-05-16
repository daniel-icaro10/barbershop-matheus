"use client"
import { motion } from "framer-motion"
import { motionTokens } from "./tokens"

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  className?: string
  y?: number
}

export function FadeIn({ children, delay = 0, className, y = 12 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.ease.smooth, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
