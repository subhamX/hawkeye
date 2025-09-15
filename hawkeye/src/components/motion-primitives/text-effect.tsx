'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface TextEffectProps {
  children: string
  per?: 'word' | 'char' | 'line'
  as?: keyof JSX.IntrinsicElements
  className?: string
  preset?: 'fade-in' | 'fade-in-blur' | 'slide-up' | 'slide-down'
  speedSegment?: number
  delay?: number
}

export function TextEffect({
  children,
  per = 'word',
  as: Component = 'p',
  className,
  preset = 'fade-in',
  speedSegment = 0.1,
  delay = 0,
}: TextEffectProps) {
  const segments = per === 'word' ? children.split(' ') : per === 'char' ? children.split('') : [children]

  const variants = {
    'fade-in': {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    'fade-in-blur': {
      hidden: { opacity: 0, filter: 'blur(10px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
    },
    'slide-up': {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    'slide-down': {
      hidden: { opacity: 0, y: -20 },
      visible: { opacity: 1, y: 0 },
    },
  }

  return (
    <Component className={className}>
      {segments.map((segment, index) => (
        <motion.span
          key={index}
          initial="hidden"
          animate="visible"
          variants={variants[preset]}
          transition={{
            duration: 0.5,
            delay: delay + index * speedSegment,
            ease: 'easeOut',
          }}
          className={per === 'word' ? 'inline-block mr-1' : 'inline-block'}
        >
          {segment}
          {per === 'word' && index < segments.length - 1 && ' '}
        </motion.span>
      ))}
    </Component>
  )
}