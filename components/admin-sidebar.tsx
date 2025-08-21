"use client"

import { useState, useMemo } from "react"
import { useAdminAuth } from "@/components/admin-auth-provider"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"
import {
  Plane,
  Users,
  Calendar,
  Settings,
  BarChart3,
  Shield,
  Database,
  Activity,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  CreditCard,
  Bell,
  Zap,
  Server,
  Monitor,
  Image,
  Code2,
  Rocket,
  Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "overview", label: "Platform Overview", icon: Shield },
  { id: "flights", label: "Flights", icon: Plane },
  { id: "flight-search", label: "Flight Search Test", icon: MapPin },
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "users", label: "Users", icon: Users },
  { id: "layovers", label: "Layovers", icon: MapPin },
  { id: "hacker-mode", label: "Hacker Mode", icon: Code2 },
  { id: "images", label: "Image Cache", icon: Image },
  { id: "yc-pitch", label: "YC Materials", icon: Rocket },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "agents", label: "AI Agents", icon: Shield },
  { id: "system", label: "System Health", icon: Activity },
  { id: "backend", label: "Backend Services", icon: Server },
  { id: "production", label: "Production", icon: Monitor },
  { id: "integrations", label: "Integrations", icon: Zap },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
]

export function AdminSidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, hasPermission } = useAdminAuth()

  const filteredItems = useMemo(() => {
    return navigationItems.filter((item) => {
      if (item.id === "users") {
        return true
      }
      if (item.id === "system" && !hasPermission("system-monitor")) return false
      if (item.id === "production" && !hasPermission("system-monitor")) return false
      return true
    })
  }, [hasPermission])

  const handleSectionChange = (sectionId: string) => {
    trackEvent("admin_navigation", {
      section: sectionId,
      user_role: user?.role,
      user_id: user?.id,
      timestamp: new Date().toISOString(),
    })
    onSectionChange(sectionId)
  }

  const handleToggleCollapse = () => {
    const newState = !isCollapsed
    trackEvent("admin_sidebar_toggle", {
      collapsed: newState,
      user_role: user?.role,
      user_id: user?.id,
    })
    setIsCollapsed(newState)
  }

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="bg-sidebar-accent rounded-lg p-1.5">
                <Plane className="h-5 w-5 text-sidebar-accent-foreground" />
              </div>
              <span className="font-serif font-bold text-sidebar-foreground">LayoverHQ</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
                isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                isCollapsed && "px-2",
              )}
              onClick={() => handleSectionChange(item.id)}
            >
              <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          )
        })}
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="bg-sidebar-accent rounded-full p-2">
              <Database className="h-4 w-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
