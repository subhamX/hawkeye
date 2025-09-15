'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface AnimatedGroupProps {
  children: React.ReactNode
  className?: string
  variants?: any
  delay?: number
}

export function AnimatedGroup({ children, className, variants, delay = 0 }: AnimatedGroupProps) {
  const defaultVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: delay,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: 'easeOut',
        },
      },
    },
  }

  const finalVariants = variants || defaultVariants

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={finalVariants.container}
      className={cn(className)}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={finalVariants.item}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={finalVariants.item}>{children}</motion.div>
      }
    </motion.div>
  )
}