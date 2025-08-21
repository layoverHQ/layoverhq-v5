"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  Download,
  Settings,
  BarChart3,
  PieChart,
  Calendar,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Zap,
} from "lucide-react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart as PieChartRecharts,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface PartnerPortalProps {
  enterpriseId: string
  userRole: "admin" | "viewer" | "analyst"
}

interface DashboardMetrics {
  overview: {
    totalBookings: number
    totalRevenue: number
    totalCustomers: number
    conversionRate: number
    averageOrderValue: number
    periodComparison: {
      bookings: { current: number; previous: number; change: number }
      revenue: { current: number; previous: number; change: number }
      customers: { current: number; previous: number; change: number }
    }
  }
  realTime: {
    activeUsers: number
    searchesPerHour: number
    bookingsPerHour: number
    apiRequestsPerMinute: number
    errorRate: number
    responseTime: number
  }
  bookingAnalytics: {
    bySource: { source: string; count: number; revenue: number }[]
    byDestination: { city: string; count: number; revenue: number }[]
    conversionFunnel: {
      searches: number
      clicks: number
      bookings: number
      conversions: number
    }
    revenueByMonth: { month: string; revenue: number; bookings: number }[]
  }
  customerInsights: {
    demographics: {
      ageGroups: { range: string; percentage: number }[]
      countries: { country: string; percentage: number }[]
    }
    behavior: {
      averageSessionDuration: number
      pagesPerSession: number
      bounceRate: number
      repeatBookingRate: number
    }
  }
  revenueAnalytics: {
    totalRevenue: number
    commissions: {
      earned: number
      pending: number
      paid: number
      nextPayout: Date
      commission_rate: number
    }
  }
}

interface Alert {
  id: string
  type: "performance" | "revenue" | "integration" | "security"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  createdAt: Date
  isActive: boolean
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function EnterprisePartnerPortal({ enterpriseId, userRole }: PartnerPortalProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d")
  const [activeTab, setActiveTab] = useState("overview")
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    loadDashboardData()
    // Setup real-time updates
    const interval = setInterval(loadRealTimeData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [enterpriseId, selectedTimeRange])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/v1/enterprise/${enterpriseId}/dashboard?timeRange=${selectedTimeRange}`,
      )
      const data = await response.json()
      setMetrics(data.metrics)
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadRealTimeData = async () => {
    try {
      const response = await fetch(`/api/v1/enterprise/${enterpriseId}/realtime`)
      const data = await response.json()
      if (metrics) {
        setMetrics({ ...metrics, realTime: data.realTime })
      }
    } catch (error) {
      console.error("Failed to load real-time data:", error)
    }
  }

  const exportReport = async (format: "pdf" | "csv" | "excel") => {
    try {
      setIsExporting(true)
      const response = await fetch(`/api/v1/enterprise/${enterpriseId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          timeRange: selectedTimeRange,
          metrics: ["overview", "bookings", "revenue", "customers"],
        }),
      })

      const { downloadUrl } = await response.json()
      window.open(downloadUrl, "_blank")
    } catch (error) {
      console.error("Failed to export report:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatPercentage = (value: number, showSign = true) => {
    const sign = showSign && value > 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  const getChangeColor = (change: number) => {
    return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
  }

  const getChangeIcon = (change: number) => {
    return change > 0 ? TrendingUp : change < 0 ? TrendingDown : Activity
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    }
    return colors[severity as keyof typeof colors] || colors.low
  }

  const getSeverityIcon = (severity: string) => {
    const icons = {
      low: CheckCircle,
      medium: AlertCircle,
      high: AlertTriangle,
      critical: XCircle,
    }
    return icons[severity as keyof typeof icons] || CheckCircle
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
          <p className="text-gray-600">Real-time analytics and insights for your integration</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button variant="outline" onClick={() => exportReport("pdf")} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.filter((a) => a.isActive).length > 0 && (
        <div className="space-y-2">
          {alerts
            .filter((a) => a.isActive)
            .map((alert) => {
              const SeverityIcon = getSeverityIcon(alert.severity)
              return (
                <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                  <SeverityIcon className="h-4 w-4" />
                  <div>
                    <div className="font-semibold">{alert.title}</div>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </div>
                </Alert>
              )
            })}
        </div>
      )}

      {/* Real-time Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.realTime.activeUsers}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.realTime.searchesPerHour}
              </div>
              <div className="text-sm text-gray-600">Searches/Hour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.realTime.bookingsPerHour}
              </div>
              <div className="text-sm text-gray-600">Bookings/Hour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.realTime.apiRequestsPerMinute}
              </div>
              <div className="text-sm text-gray-600">API Requests/Min</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${metrics.realTime.errorRate > 5 ? "text-red-600" : "text-green-600"}`}
              >
                {formatPercentage(metrics.realTime.errorRate, false)}
              </div>
              <div className="text-sm text-gray-600">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {metrics.realTime.responseTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="api">API Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.overview.totalBookings.toLocaleString()}
                </div>
                <div
                  className={`text-xs ${getChangeColor(metrics.overview.periodComparison.bookings.change)} flex items-center`}
                >
                  {React.createElement(
                    getChangeIcon(metrics.overview.periodComparison.bookings.change),
                    { className: "h-3 w-3 mr-1" },
                  )}
                  {formatPercentage(metrics.overview.periodComparison.bookings.change)} from
                  previous period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.overview.totalRevenue)}
                </div>
                <div
                  className={`text-xs ${getChangeColor(metrics.overview.periodComparison.revenue.change)} flex items-center`}
                >
                  {React.createElement(
                    getChangeIcon(metrics.overview.periodComparison.revenue.change),
                    { className: "h-3 w-3 mr-1" },
                  )}
                  {formatPercentage(metrics.overview.periodComparison.revenue.change)} from previous
                  period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(metrics.overview.conversionRate, false)}
                </div>
                <div className="text-xs text-gray-600">
                  {metrics.overview.totalCustomers} unique customers
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.overview.averageOrderValue)}
                </div>
                <div className="text-xs text-gray-600">Per booking average</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue and booking volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.bookingAnalytics.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="right" dataKey="bookings" fill="#8884d8" name="Bookings" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#82ca9d"
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          {/* Booking Sources and Destinations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Sources</CardTitle>
                <CardDescription>Top traffic sources driving bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChartRecharts>
                    <Pie
                      data={metrics.bookingAnalytics.bySource}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, count }) => `${source}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {metrics.bookingAnalytics.bySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChartRecharts>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Destinations</CardTitle>
                <CardDescription>Most popular booking destinations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.bookingAnalytics.byDestination.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Customer journey from search to booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium">Searches</div>
                  <div className="flex-1">
                    <Progress value={100} className="w-full" />
                  </div>
                  <div className="w-20 text-right font-medium">
                    {metrics.bookingAnalytics.conversionFunnel.searches.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium">Clicks</div>
                  <div className="flex-1">
                    <Progress
                      value={
                        (metrics.bookingAnalytics.conversionFunnel.clicks /
                          metrics.bookingAnalytics.conversionFunnel.searches) *
                        100
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="w-20 text-right font-medium">
                    {metrics.bookingAnalytics.conversionFunnel.clicks.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium">Bookings</div>
                  <div className="flex-1">
                    <Progress
                      value={
                        (metrics.bookingAnalytics.conversionFunnel.bookings /
                          metrics.bookingAnalytics.conversionFunnel.searches) *
                        100
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="w-20 text-right font-medium">
                    {metrics.bookingAnalytics.conversionFunnel.bookings.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer Demographics and Behavior */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Demographics</CardTitle>
                <CardDescription>Customer age distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.customerInsights.demographics.ageGroups}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Top customer countries</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChartRecharts>
                    <Pie
                      data={metrics.customerInsights.demographics.countries}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ country, percentage }) => `${country}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {metrics.customerInsights.demographics.countries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChartRecharts>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Behavioral Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.floor(metrics.customerInsights.behavior.averageSessionDuration / 60)}m{" "}
                  {metrics.customerInsights.behavior.averageSessionDuration % 60}s
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.customerInsights.behavior.pagesPerSession.toFixed(1)} pages per session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(metrics.customerInsights.behavior.bounceRate, false)}
                </div>
                <p className="text-xs text-muted-foreground">Single page visits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repeat Bookings</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(metrics.customerInsights.behavior.repeatBookingRate, false)}
                </div>
                <p className="text-xs text-muted-foreground">Customer retention rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.realTime.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue and Commission Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earned Commission</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(metrics.revenueAnalytics.commissions.earned)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(metrics.revenueAnalytics.commissions.commission_rate, false)}{" "}
                  commission rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(metrics.revenueAnalytics.commissions.pending)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Next payout:{" "}
                  {new Date(metrics.revenueAnalytics.commissions.nextPayout).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(metrics.revenueAnalytics.commissions.paid)}
                </div>
                <p className="text-xs text-muted-foreground">Lifetime earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.revenueAnalytics.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">Platform revenue generated</p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Payments</CardTitle>
              <CardDescription>
                Your commission payment history and upcoming payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Last Payment</div>
                      <div className="text-sm text-gray-600">Processed successfully</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{formatCurrency(2450.0)}</div>
                    <div className="text-sm text-gray-600">Dec 1, 2024</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium">Next Payment</div>
                      <div className="text-sm text-gray-600">Processing on Jan 1, 2025</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600">
                      {formatCurrency(metrics.revenueAnalytics.commissions.pending)}
                    </div>
                    <div className="text-sm text-gray-600">Estimated</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          {/* API Usage Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.realTime.apiRequestsPerMinute * 60 * 24).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Daily average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPercentage(100 - metrics.realTime.errorRate, false)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(metrics.realTime.errorRate, false)} error rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.realTime.responseTime.toFixed(0)}ms
                </div>
                <p className="text-xs text-muted-foreground">Average response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quota Usage</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">Of monthly quota</p>
              </CardContent>
            </Card>
          </div>

          {/* API Health Status */}
          <Card>
            <CardHeader>
              <CardTitle>API Health Status</CardTitle>
              <CardDescription>Current status of all API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    endpoint: "/api/v1/flights/search",
                    status: "healthy",
                    responseTime: 145,
                    uptime: 99.9,
                  },
                  {
                    endpoint: "/api/v1/experiences/search",
                    status: "healthy",
                    responseTime: 210,
                    uptime: 99.8,
                  },
                  {
                    endpoint: "/api/v1/bookings",
                    status: "degraded",
                    responseTime: 890,
                    uptime: 98.5,
                  },
                  {
                    endpoint: "/api/v1/webhooks",
                    status: "healthy",
                    responseTime: 95,
                    uptime: 100,
                  },
                ].map((endpoint) => (
                  <div
                    key={endpoint.endpoint}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          endpoint.status === "healthy"
                            ? "bg-green-500"
                            : endpoint.status === "degraded"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <div>
                        <div className="font-medium">{endpoint.endpoint}</div>
                        <div className="text-sm text-gray-600 capitalize">{endpoint.status}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{endpoint.responseTime}ms</div>
                      <div className="text-sm text-gray-600">{endpoint.uptime}% uptime</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
