'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface HoverCardProps {
  children: React.ReactNode
  className?: string
  scale?: number
  rotateX?: number
  rotateY?: number
}

export function HoverCard({
  children,
  className,
  scale = 1.02,
  rotateX = 0,
  rotateY = 0,
}: HoverCardProps) {
  return (
    <motion.div
      whileHover={{
        scale,
        rotateX,
        rotateY,
      }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}