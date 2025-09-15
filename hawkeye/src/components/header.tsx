'use client'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { ThemeToggle } from '@/components/theme-toggle'

const menuItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Reports', href: '/reports' },
    { name: 'Settings', href: '/settings' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
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
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2">
                <motion.div 
                    className={cn(
                        'mx-auto mt-2 max-w-6xl px-6 transition-all duration-500 lg:px-12',
                        isScrolled && 'bg-background/80 max-w-4xl rounded-2xl border backdrop-blur-xl shadow-lg lg:px-5'
                    )}
                    animate={{
                        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo size="sm" />
                            </Link>

                            <motion.button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <AnimatePresence mode="wait">
                                    {!menuState ? (
                                        <motion.div
                                            key="menu"
                                            initial={{ rotate: -90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Menu className="size-6" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="close"
                                            initial={{ rotate: 90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: -90, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <X className="size-6" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <motion.li 
                                        key={index}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <Link
                                            href={item.href}
                                            className="text-secondary hover:text-primary relative block duration-300 group">
                                            <span>{item.name}</span>
                                            <motion.div
                                                className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                                                initial={{ width: 0 }}
                                                whileHover={{ width: '100%' }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        <AnimatePresence>
                            {(menuState || !menuState) && (
                                <motion.div 
                                    className={cn(
                                        "bg-background/95 backdrop-blur-xl mb-6 w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none",
                                        menuState ? "block lg:flex" : "hidden lg:flex"
                                    )}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="lg:hidden">
                                        <ul className="space-y-6 text-base">
                                            {menuItems.map((item, index) => (
                                                <motion.li 
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                                >
                                                    <Link
                                                        href={item.href}
                                                        className="text-secondary hover:text-primary block duration-300"
                                                        onClick={() => setMenuState(false)}
                                                    >
                                                        <span>{item.name}</span>
                                                    </Link>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                    <motion.div 
                                        className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit md:items-center"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, delay: 0.2 }}
                                    >
                                        <ThemeToggle />
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                'transition-all duration-300 hover:scale-105',
                                                isScrolled && 'lg:hidden'
                                            )}>
                                            <Link href="/auth/signin">
                                                <span>Login</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            className={cn(
                                                'btn-gradient transition-all duration-300 hover:scale-105',
                                                isScrolled && 'lg:hidden'
                                            )}>
                                            <Link href="/auth/signup">
                                                <span>Sign Up</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            className={cn(
                                                'btn-gradient transition-all duration-300 hover:scale-105',
                                                isScrolled ? 'lg:inline-flex' : 'hidden'
                                            )}>
                                            <Link href="/dashboard">
                                                <span>Get Started</span>
                                            </Link>
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.nav>
        </header>
    )
}
