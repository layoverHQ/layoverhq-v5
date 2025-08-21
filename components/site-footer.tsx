"use client"

import type React from "react"

import Link from "next/link"
import { Plane, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function SiteFooter() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement newsletter subscription
    setIsSubscribed(true)
    setEmail("")
  }

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Plane className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">LayoverHQ</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Transform your layovers into adventures. Discover amazing city tours, experiences, and
              connections that turn travel time into exploration time.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-slate-300 hover:text-white transition-colors">
                  Search Flights
                </Link>
              </li>
              <li>
                <Link
                  href="/experiences"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Layover Experiences
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  My Bookings
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Join LayoverHQ Club
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Popular Destinations
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/support" className="text-slate-300 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/support/contact"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/support/faq"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/support/booking-help"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Booking Help
                </Link>
              </li>
              <li>
                <Link
                  href="/support/travel-tips"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Travel Tips
                </Link>
              </li>
            </ul>
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Mail className="h-4 w-4" />
                <span>support@layoverhq.com</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-slate-300 text-sm">
              Get the latest layover deals and travel tips delivered to your inbox.
            </p>
            {!isSubscribed ? (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Subscribe
                </Button>
              </form>
            ) : (
              <div className="p-3 bg-green-900/30 border border-green-700 rounded-md">
                <p className="text-green-300 text-sm">✓ Successfully subscribed!</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center space-x-6 text-sm text-slate-400">
              <Link href="/legal/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/cookies" className="hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <Link href="/legal/accessibility" className="hover:text-white transition-colors">
                Accessibility
              </Link>
            </div>
            <div className="text-sm text-slate-400">© 2024 LayoverHQ. All rights reserved.</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
