"use client"
import { motion } from "framer-motion"

export function HoverCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
