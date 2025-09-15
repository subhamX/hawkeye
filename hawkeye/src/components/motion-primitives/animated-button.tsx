'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

interface AnimatedButtonProps extends Omit<ButtonProps, 'variant'> {
  children: React.ReactNode;
  className?: string;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'gradient';
}

export const AnimatedButton = forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(({ children, className, variant = 'default', ...props }, ref) => {
  const isGradient = variant === 'gradient';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        isGradient &&
          'bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-0.5'
      )}
    >
      <Button
        ref={ref}
        variant={isGradient ? 'default' : (variant as ButtonProps['variant'])}
        className={cn(
          'relative overflow-hidden',
          isGradient &&
            'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0',
          className
        )}
        {...props}
      >
        <motion.div
          className="absolute inset-0 bg-white/20"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5 }}
        />
        <span className="relative z-10">{children}</span>
      </Button>
    </motion.div>
  );
});

AnimatedButton.displayName = 'AnimatedButton';
