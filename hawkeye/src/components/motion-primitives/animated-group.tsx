'use client';

import { motion, Variants } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedGroupProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
}

export function AnimatedGroup({
  children,
  className,
  variants,
  delay = 0,
}: AnimatedGroupProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants || containerVariants}
      className={cn(className)}
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={itemVariants}>{children}</motion.div>
      )}
    </motion.div>
  );
}
