"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plane, Search, Globe, User, Menu, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationProps {
  className?: string
}

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/search', label: 'Flights', icon: Plane },
    { href: '/experiences', label: 'Experiences', icon: Globe },
    { href: '/dashboard', label: 'My Trips', icon: User },
  ]

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-sm",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">LayoverHQ</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary-50 text-primary-700" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search Button */}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="h-5 w-5" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-700" />
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <Link
                    href="/auth/login"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <Link
              href="/search"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Book a Trip
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    isActive 
                      ? "bg-primary-50 text-primary-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              )
            })}
            
            <hr className="my-3 border-gray-200" />
            
            <Link
              href="/auth/login"
              className="block px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            
            <Link
              href="/search"
              className="block bg-primary-600 text-white px-4 py-3 rounded-lg text-base font-medium text-center hover:bg-primary-700 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Book a Trip
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}