"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Star,
  RefreshCw,
} from "lucide-react"

interface BusinessMetrics {
  revenue: {
    total: number
    growth: number
    trend: "up" | "down"
    breakdown: { month: string; amount: number; bookings: number }[]
  }
  bookings: {
    total: number
    growth: number
    trend: "up" | "down"
    byStatus: { status: string; count: number; percentage: number }[]
    byDestination: { destination: string; count: number; revenue: number }[]
  }
  users: {
    total: number
    active: number
    growth: number
    trend: "up" | "down"
    retention: number
    clubMembers: { tier: string; count: number; percentage: number }[]
  }
  layovers: {
    totalHours: number
    averageRating: number
    popularDestinations: { city: string; bookings: number; rating: number; revenue: number }[]
    experienceTypes: { type: string; bookings: number; revenue: number }[]
  }
}

const mockBusinessMetrics: BusinessMetrics = {
  revenue: {
    total: 2847500,
    growth: 18.2,
    trend: "up",
    breakdown: [
      { month: "Jan", amount: 180000, bookings: 145 },
      { month: "Feb", amount: 220000, bookings: 178 },
      { month: "Mar", amount: 285000, bookings: 234 },
      { month: "Apr", amount: 310000, bookings: 267 },
      { month: "May", amount: 340000, bookings: 289 },
      { month: "Jun", amount: 385000, bookings: 312 },
    ],
  },
  bookings: {
    total: 1247,
    growth: 12.5,
    trend: "up",
    byStatus: [
      { status: "confirmed", count: 856, percentage: 68.6 },
      { status: "pending", count: 234, percentage: 18.8 },
      { status: "cancelled", count: 89, percentage: 7.1 },
      { status: "completed", count: 68, percentage: 5.5 },
    ],
    byDestination: [
      { destination: "Dubai", count: 234, revenue: 456000 },
      { destination: "Istanbul", count: 189, revenue: 378000 },
      { destination: "Singapore", count: 167, revenue: 334000 },
      { destination: "Doha", count: 145, revenue: 290000 },
      { destination: "Amsterdam", count: 123, revenue: 246000 },
    ],
  },
  users: {
    total: 8934,
    active: 3456,
    growth: 15.3,
    trend: "up",
    retention: 78.5,
    clubMembers: [
      { tier: "Explorer", count: 5234, percentage: 58.6 },
      { tier: "Adventurer", count: 2145, percentage: 24.0 },
      { tier: "Nomad", count: 1234, percentage: 13.8 },
      { tier: "Elite", count: 321, percentage: 3.6 },
    ],
  },
  layovers: {
    totalHours: 45678,
    averageRating: 4.6,
    popularDestinations: [
      { city: "Dubai", bookings: 234, rating: 4.8, revenue: 456000 },
      { city: "Istanbul", bookings: 189, rating: 4.7, revenue: 378000 },
      { city: "Singapore", bookings: 167, rating: 4.9, revenue: 334000 },
      { city: "Doha", bookings: 145, rating: 4.5, revenue: 290000 },
      { city: "Amsterdam", bookings: 123, rating: 4.6, revenue: 246000 },
    ],
    experienceTypes: [
      { type: "City Tours", bookings: 456, revenue: 912000 },
      { type: "Food Experiences", bookings: 234, revenue: 468000 },
      { type: "Cultural Activities", bookings: 189, revenue: 378000 },
      { type: "Shopping", bookings: 167, revenue: 334000 },
      { type: "Transit Hotels", bookings: 201, revenue: 402000 },
    ],
  },
}

const COLORS = ["#0891b2", "#0e7490", "#155e75", "#164e63", "#1e293b"]

export function BusinessAnalytics() {
  const [metrics, setMetrics] = useState<BusinessMetrics>(mockBusinessMetrics)
  const [timeRange, setTimeRange] = useState("6m")
  const [isLoading, setIsLoading] = useState(false)

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Business Intelligence Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for LayoverHQ
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.total)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.revenue.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {metrics.revenue.growth}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.bookings.total)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.bookings.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {metrics.bookings.growth}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.users.active)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="mr-2">of {formatNumber(metrics.users.total)} total</span>
              {metrics.users.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {metrics.users.growth}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Layover Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.layovers.totalHours)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 text-yellow-500 mr-1" />
              {metrics.layovers.averageRating} avg rating
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="layovers">Layovers</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.revenue.breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), "Revenue"]} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#0891b2"
                    fill="#0891b2"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.bookings.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.bookings.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Destinations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.bookings.byDestination}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="destination" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0891b2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>LayoverHQ Club Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.users.clubMembers.map((tier, index) => (
                    <div key={tier.tier} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{tier.tier}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatNumber(tier.count)}</div>
                        <div className="text-sm text-muted-foreground">
                          {tier.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">User Retention Rate</span>
                      <span className="text-2xl font-bold text-green-600">
                        {metrics.users.retention}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${metrics.users.retention}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(metrics.users.total)}</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(metrics.users.active)}</div>
                      <div className="text-sm text-muted-foreground">Active Users</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="layovers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Layover Destinations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.layovers.popularDestinations.map((destination, index) => (
                    <div
                      key={destination.city}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{destination.city}</span>
                        </div>
                        <Badge variant="outline">{destination.bookings} bookings</Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm font-medium">{destination.rating}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(destination.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Experience Types Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.layovers.experienceTypes} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                    <YAxis dataKey="type" type="category" width={100} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), "Revenue"]} />
                    <Bar dataKey="revenue" fill="#0891b2" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
