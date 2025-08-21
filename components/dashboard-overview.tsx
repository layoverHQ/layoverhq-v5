"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Plane,
  Calendar,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { RecentActivity } from "./recent-activity"

// Mock data - in real app, this would come from APIs
const mockStats = {
  totalBookings: { value: 1247, change: 12.5, trend: "up" },
  activeUsers: { value: 8934, change: -2.1, trend: "down" },
  revenue: { value: 284750, change: 18.2, trend: "up" },
  flightRoutes: { value: 156, change: 5.3, trend: "up" },
}

const mockSystemHealth = [
  { service: "Flight Service", status: "healthy", uptime: "99.9%" },
  { service: "Booking Service", status: "healthy", uptime: "99.8%" },
  { service: "AI Service", status: "warning", uptime: "98.2%" },
  { service: "Payment Service", status: "healthy", uptime: "99.9%" },
]

const mockRecentActivity = [
  { id: 1, type: "booking", message: "New booking: NYC → Dubai → Singapore", time: "2 min ago" },
  { id: 2, type: "user", message: "New user registration: john.doe@email.com", time: "5 min ago" },
  { id: 3, type: "system", message: "AI Agent completed route optimization", time: "12 min ago" },
  { id: 4, type: "alert", message: "High traffic detected on Dubai routes", time: "18 min ago" },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStats.totalBookings.value.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {mockStats.totalBookings.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(mockStats.totalBookings.change)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeUsers.value.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {mockStats.activeUsers.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(mockStats.activeUsers.change)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockStats.revenue.value.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {mockStats.revenue.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(mockStats.revenue.change)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flight Routes</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.flightRoutes.value}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {mockStats.flightRoutes.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(mockStats.flightRoutes.change)}% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Health</span>
            </CardTitle>
            <CardDescription>Real-time status of all microservices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockSystemHealth.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {service.status === "healthy" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : service.status === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">{service.service}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={service.status === "healthy" ? "default" : "secondary"}
                    className={service.status === "healthy" ? "bg-green-100 text-green-800" : ""}
                  >
                    {service.uptime}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </div>
  )
}
