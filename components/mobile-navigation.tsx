"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, X, Search, User, Calendar, MapPin, Clock, Bell } from "lucide-react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileNavigationProps {
  user?: any
}

export function MobileNavigation({ user }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isMobile) return null

  const navigationItems = [
    { href: "/search", label: "Search Flights", icon: Search, badge: null },
    { href: "/experiences", label: "Experiences", icon: MapPin, badge: "New" },
    { href: "/dashboard", label: "My Trips", icon: Calendar, badge: null },
    { href: "/club", label: "LayoverHQ Club", icon: Clock, badge: null },
  ]

  return (
    <>
      {/* Mobile Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">LayoverHQ</span>
          </Link>

          <div className="flex items-center space-x-2">
            {user && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">3</Badge>
              </Button>
            )}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-6 w-6 text-primary" />
                      <span className="font-bold text-lg">LayoverHQ</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* User Section */}
                  {user ? (
                    <div className="bg-primary/5 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary rounded-full p-2">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name || "Traveler"}</p>
                          <p className="text-sm text-muted-foreground">Explorer Member</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-4 mb-6 text-white">
                      <h3 className="font-semibold mb-2">Join LayoverHQ</h3>
                      <p className="text-sm opacity-90 mb-3">
                        Unlock exclusive layover experiences
                      </p>
                      <Link href="/auth/register">
                        <Button variant="secondary" size="sm" className="w-full">
                          Sign Up Free
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Navigation Items */}
                  <nav className="flex-1 space-y-2">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </nav>

                  {/* Bottom Actions */}
                  <div className="border-t pt-4 space-y-2">
                    {user ? (
                      <>
                        <Link href="/dashboard/profile" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            <User className="h-4 w-4 mr-2" />
                            Profile Settings
                          </Button>
                        </Link>
                        <Button variant="ghost" className="w-full justify-start text-destructive">
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full bg-transparent">
                          Sign In
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
        <div className="grid grid-cols-4 gap-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-2 px-1 text-center hover:bg-muted transition-colors"
            >
              <div className="relative">
                <item.icon className="h-5 w-5 text-muted-foreground mb-1" />
                {item.badge && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {item.label.split(" ")[0]}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
