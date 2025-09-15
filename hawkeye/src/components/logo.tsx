'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export const Logo = ({ className, uniColor, size = 'md' }: { 
  className?: string; 
  uniColor?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
    const sizes = {
        sm: { icon: 'h-6 w-6', text: 'text-lg' },
        md: { icon: 'h-8 w-8', text: 'text-xl' },
        lg: { icon: 'h-10 w-10', text: 'text-2xl' },
        xl: { icon: 'h-12 w-12', text: 'text-3xl' }
    }

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-3"
        >
            <motion.div
                className="relative"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.6 }}
            >
                <motion.svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(sizes[size].icon, className)}
                >
                    {/* Outer ring with tech pattern */}
                    <motion.circle
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke={uniColor ? 'currentColor' : 'url(#logo-gradient)'}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    />
                    
                    {/* Main eye shape with better proportions */}
                    <motion.path
                        d="M20 10C12 10 6 16 4 20C6 24 12 30 20 30C28 30 34 24 36 20C34 16 28 10 20 10Z"
                        fill={uniColor ? 'currentColor' : 'url(#logo-gradient)'}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    />
                    
                    {/* Iris with gradient */}
                    <motion.circle
                        cx="20"
                        cy="20"
                        r="6"
                        fill="url(#iris-gradient)"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    />
                    
                    {/* Pupil */}
                    <motion.circle
                        cx="20"
                        cy="20"
                        r="3"
                        fill="#1a1a1a"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                    />
                    
                    {/* Multiple highlights for depth */}
                    <motion.circle
                        cx="21.5"
                        cy="18.5"
                        r="1.2"
                        fill="white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        transition={{ duration: 0.2, delay: 0.7 }}
                    />
                    <motion.circle
                        cx="19"
                        cy="21"
                        r="0.5"
                        fill="white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ duration: 0.2, delay: 0.8 }}
                    />
                    
                    {/* Tech scanning lines */}
                    <motion.path
                        d="M8 20 L12 20 M28 20 L32 20"
                        stroke={uniColor ? 'currentColor' : 'url(#scan-gradient)'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    />
                    
                    <defs>
                        <linearGradient
                            id="logo-gradient"
                            x1="20"
                            y1="10"
                            x2="20"
                            y2="30"
                            gradientUnits="userSpaceOnUse">
                            <stop stopColor="#3B82F6" />
                            <stop offset="0.3" stopColor="#6366F1" />
                            <stop offset="0.7" stopColor="#8B5CF6" />
                            <stop offset="1" stopColor="#06B6D4" />
                        </linearGradient>
                        
                        <radialGradient
                            id="iris-gradient"
                            cx="20"
                            cy="20"
                            r="6"
                            gradientUnits="userSpaceOnUse">
                            <stop stopColor="#60A5FA" />
                            <stop offset="0.7" stopColor="#3B82F6" />
                            <stop offset="1" stopColor="#1E40AF" />
                        </radialGradient>
                        
                        <linearGradient
                            id="scan-gradient"
                            x1="8"
                            y1="20"
                            x2="32"
                            y2="20"
                            gradientUnits="userSpaceOnUse">
                            <stop stopColor="#3B82F6" />
                            <stop offset="1" stopColor="#06B6D4" />
                        </linearGradient>
                    </defs>
                </motion.svg>
            </motion.div>
            
            <motion.div
                className="flex flex-col"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <motion.span
                    className={cn(
                        sizes[size].text,
                        "font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-100 dark:to-white bg-clip-text text-transparent tracking-tight"
                    )}
                >
                    HawkEye
                </motion.span>
            </motion.div>
        </motion.div>
    )
}

export const LogoIcon = ({ className, uniColor, size = 'md' }: { 
  className?: string; 
  uniColor?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
    const sizes = {
        sm: 'size-6',
        md: 'size-8',
        lg: 'size-10'
    }

    return (
        <motion.div
            className="relative"
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
            transition={{ duration: 0.6 }}
        >
            <motion.svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn(sizes[size], className)}
            >
                {/* Outer ring */}
                <motion.circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke={uniColor ? 'currentColor' : 'url(#logo-gradient-icon)'}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                
                {/* Main eye shape */}
                <path
                    d="M20 10C12 10 6 16 4 20C6 24 12 30 20 30C28 30 34 24 36 20C34 16 28 10 20 10Z"
                    fill={uniColor ? 'currentColor' : 'url(#logo-gradient-icon)'}
                />
                
                {/* Iris */}
                <circle cx="20" cy="20" r="6" fill="url(#iris-gradient-icon)" />
                
                {/* Pupil */}
                <circle cx="20" cy="20" r="3" fill="#1a1a1a" />
                
                {/* Highlights */}
                <circle cx="21.5" cy="18.5" r="1.2" fill="white" opacity="0.9" />
                <circle cx="19" cy="21" r="0.5" fill="white" opacity="0.6" />
                
                {/* Scanning lines */}
                <motion.path
                    d="M8 20 L12 20 M28 20 L32 20"
                    stroke={uniColor ? 'currentColor' : 'url(#scan-gradient-icon)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                
                <defs>
                    <linearGradient
                        id="logo-gradient-icon"
                        x1="20"
                        y1="10"
                        x2="20"
                        y2="30"
                        gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3B82F6" />
                        <stop offset="0.3" stopColor="#6366F1" />
                        <stop offset="0.7" stopColor="#8B5CF6" />
                        <stop offset="1" stopColor="#06B6D4" />
                    </linearGradient>
                    
                    <radialGradient
                        id="iris-gradient-icon"
                        cx="20"
                        cy="20"
                        r="6"
                        gradientUnits="userSpaceOnUse">
                        <stop stopColor="#60A5FA" />
                        <stop offset="0.7" stopColor="#3B82F6" />
                        <stop offset="1" stopColor="#1E40AF" />
                    </radialGradient>
                    
                    <linearGradient
                        id="scan-gradient-icon"
                        x1="8"
                        y1="20"
                        x2="32"
                        y2="20"
                        gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3B82F6" />
                        <stop offset="1" stopColor="#06B6D4" />
                    </linearGradient>
                </defs>
            </motion.svg>
        </motion.div>
    )
}

export const LogoStroke = ({ className, size = 'md' }: { 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
    const sizes = {
        sm: 'size-6',
        md: 'size-8',
        lg: 'size-10'
    }

    return (
        <motion.svg
            className={cn(sizes[size], className)}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
        >
            {/* Outer ring */}
            <motion.circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2 2"
                initial={{ rotate: 0, pathLength: 0 }}
                animate={{ rotate: 360, pathLength: 1 }}
                transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                    pathLength: { duration: 2, ease: "easeInOut" }
                }}
            />
            
            {/* Main eye outline */}
            <motion.path
                d="M20 10C12 10 6 16 4 20C6 24 12 30 20 30C28 30 34 24 36 20C34 16 28 10 20 10Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
            />
            
            {/* Iris outline */}
            <motion.circle
                cx="20"
                cy="20"
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
            />
            
            {/* Pupil */}
            <motion.circle
                cx="20"
                cy="20"
                r="3"
                fill="currentColor"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1 }}
            />
            
            {/* Scanning lines */}
            <motion.path
                d="M8 20 L12 20 M28 20 L32 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
            />
        </motion.svg>
    )
}