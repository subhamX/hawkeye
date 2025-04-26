'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import { Eye } from 'lucide-react'
import { HIRE_ON_MASUMI_LINK } from './hero-section'
import { VIEW_ANALYSIS_LINK } from './hero-section'

export const HeroHeader = () => {
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    
    return (
        <header>
            <nav className="fixed z-20 w-full px-2">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex items-center justify-between gap-6 py-3 lg:py-4">
                        <Link
                            href="/"
                            aria-label="home"
                            className="flex items-center space-x-3 group">
                            {/* <div className="relative">
                                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-gray-800 to-black opacity-75 blur group-hover:opacity-100 transition duration-200"></div>
                                <div className="relative flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-900 rounded-lg">
                                    <Eye className="w-6 h-6 text-gray-900" />

                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold bg-gradient-to-r text-gray-900">
                                    HawkEye
                                </span>
                                <span className="text-xs text-muted-foreground">Cloud Intelligence Platform</span>
                            </div> */}

                            <img src="/logo.jpeg" alt="HawkEye" width={200} height={100} />
                        </Link>

                        <div className="flex items-center gap-4">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="font-medium">
                                <Link href={VIEW_ANALYSIS_LINK}>
                                    View Analysis
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                className="font-medium">
                                <Link href={HIRE_ON_MASUMI_LINK}>
                                    Explore in Masumi
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
