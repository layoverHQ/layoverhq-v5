"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, User, Plane, Bot, AlertTriangle, CreditCard, MapPin } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

interface ActivityItem {
  id: string
  type: "booking" | "user" | "ai" | "system" | "payment" | "route"
  title: string
  description: string
  timestamp: Date
  severity: "info" | "warning" | "success" | "error"
  metadata?: Record<string, any>
}

const activityIcons = {
  booking: Plane,
  user: User,
  ai: Bot,
  system: AlertTriangle,
  payment: CreditCard,
  route: MapPin,
}

const severityColors = {
  info: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Generate realistic activity data
  const generateActivities = (): ActivityItem[] => {
    const now = new Date()
    const activities: ActivityItem[] = [
      {
        id: "1",
        type: "booking",
        title: "New booking: NYC → Dubai → Singapore",
        description: "Multi-city layover booking for premium customer",
        timestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
        severity: "success",
        metadata: { route: "NYC-DXB-SIN", customer: "premium" },
      },
      {
        id: "2",
        type: "user",
        title: "New user registration: john.doe@email.com",
        description: "User completed email verification",
        timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
        severity: "info",
        metadata: { email: "john.doe@email.com", verified: true },
      },
      {
        id: "3",
        type: "ai",
        title: "AI Agent completed route optimization",
        description: "Optimized 47 routes, saved 12% on average travel time",
        timestamp: new Date(now.getTime() - 12 * 60 * 1000), // 12 min ago
        severity: "success",
        metadata: { routesOptimized: 47, timeSaved: "12%" },
      },
      {
        id: "4",
        type: "system",
        title: "High traffic detected on Dubai routes",
        description: "Traffic spike: 340% above normal levels",
        timestamp: new Date(now.getTime() - 18 * 60 * 1000), // 18 min ago
        severity: "warning",
        metadata: { location: "Dubai", spike: "340%" },
      },
      {
        id: "5",
        type: "payment",
        title: "Payment processed: $2,847.50",
        description: "Business class layover package - Tokyo",
        timestamp: new Date(now.getTime() - 25 * 60 * 1000), // 25 min ago
        severity: "success",
        metadata: { amount: 2847.5, currency: "USD", destination: "Tokyo" },
      },
      {
        id: "6",
        type: "route",
        title: "New route added: LAX → IST → BOM",
        description: "Istanbul layover route now available",
        timestamp: new Date(now.getTime() - 32 * 60 * 1000), // 32 min ago
        severity: "info",
        metadata: { route: "LAX-IST-BOM", type: "layover" },
      },
      {
        id: "7",
        type: "user",
        title: "User upgraded to Premium: sarah.wilson@corp.com",
        description: "Annual subscription activated",
        timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 min ago
        severity: "success",
        metadata: { email: "sarah.wilson@corp.com", plan: "premium" },
      },
      {
        id: "8",
        type: "system",
        title: "Database backup completed",
        description: "Automated backup finished successfully (2.3GB)",
        timestamp: new Date(now.getTime() - 58 * 60 * 1000), // 58 min ago
        severity: "info",
        metadata: { size: "2.3GB", type: "automated" },
      },
    ]

    // Add some randomization to make it feel more real-time
    return activities
      .map((activity) => ({
        ...activity,
        timestamp: new Date(activity.timestamp.getTime() + Math.random() * 60000), // Add up to 1 min variance
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newActivities = generateActivities()
      setActivities(newActivities)
      setLastUpdate(new Date())

      trackEvent("recent_activity_refreshed", {
        activityCount: newActivities.length,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("[v0] Error fetching activities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <CardDescription>Latest system events and user actions</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivities}
          disabled={isLoading}
          className="flex items-center gap-2 bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground mb-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type]
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${severityColors[activity.severity]}`}
                    >
                      {activity.type}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">{activity.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>

                    {activity.metadata && (
                      <div className="flex gap-1">
                        {Object.entries(activity.metadata)
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <span key={key} className="text-xs bg-muted px-2 py-1 rounded">
                              {String(value)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {activities.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading activities...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
