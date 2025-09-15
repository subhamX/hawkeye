'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

export function ThemeConfig() {
  const { theme, systemTheme } = useTheme()

  useEffect(() => {
    const currentTheme = theme === 'system' ? systemTheme : theme
    
    // Apply theme-specific configurations
    if (currentTheme === 'dark') {
      document.documentElement.style.setProperty('--theme-bg', 'oklch(0.0902 0.0486 219.8169)')
      document.documentElement.style.setProperty('--theme-fg', 'oklch(0.8979 0.0159 196.7940)')
      document.documentElement.style.setProperty('--theme-muted', 'oklch(0.2230 0.0283 219.1365)')
    } else {
      document.documentElement.style.setProperty('--theme-bg', 'oklch(0.9735 0.0261 90.0953)')
      document.documentElement.style.setProperty('--theme-fg', 'oklch(0.3092 0.0518 219.6516)')
      document.documentElement.style.setProperty('--theme-muted', 'oklch(0.6979 0.0159 196.7940)')
    }
  }, [theme, systemTheme])

  return null
}