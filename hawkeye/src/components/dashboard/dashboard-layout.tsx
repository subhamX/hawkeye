'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/lib/actions/auth';
import { 
  LayoutDashboard, 
  Settings, 
  Plus,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export default function DashboardLayout({ 
  children, 
  title = "Dashboard",
  subtitle,
  showBackButton = false,
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
  user
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard'
    },
    {
      name: 'Add Account',
      href: '/onboarding',
      icon: Plus,
      current: pathname === '/onboarding'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900">
      {/* Desktop Navbar */}
      <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Logo size="sm" />
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${item.current 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex md:items-center md:space-x-4">
                {user && (
                  <>
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="rounded-full w-8 h-8"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.name}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {user.email}
                      </span>
                    </div>
                    <form action={signOutAction}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        type="submit"
                        className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </form>
                  </>
                )}
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/50 dark:border-slate-700/50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors
                    ${item.current 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                {user && (
                  <div className="flex items-center space-x-4 px-3 py-2 w-full">
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="rounded-full w-10 h-10"
                      />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {user.email}
                      </div>
                    </div>
                    <form action={signOutAction}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        type="submit"
                        className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200/30 dark:border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              {showBackButton && (
                <div className="mb-4">
                  <Button variant="ghost" size="sm" asChild className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <Link href={backHref}>
                      ← {backLabel}
                    </Link>
                  </Button>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}