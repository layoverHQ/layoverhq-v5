/**
 * Analytics Dashboard - Enterprise Customer Analytics & Billing
 *
 * Comprehensive analytics and billing interface providing detailed insights
 * into usage patterns, performance metrics, and revenue tracking.
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Clock,
  Database,
  Globe,
  Download,
  Calendar as CalendarIcon,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react"

interface AnalyticsData {
  overview: {
    total_revenue: number
    revenue_growth: number
    active_tenants: number
    tenant_growth: number
    total_api_calls: number
    api_growth: number
    avg_response_time: number
    performance_change: number
  }
  revenue: {
    monthly_breakdown: Array<{
      month: string
      revenue: number
      tenants: number
      api_calls: number
    }>
    by_plan: Array<{
      plan: string
      revenue: number
      count: number
      percentage: number
    }>
    forecasted_arr: number
    churn_rate: number
  }
  usage: {
    top_tenants: Array<{
      tenant_id: string
      tenant_name: string
      api_calls: number
      revenue: number
      plan: string
      growth: number
    }>
    api_endpoints: Array<{
      endpoint: string
      calls: number
      avg_response_time: number
      error_rate: number
      revenue_impact: number
    }>
    geographic_distribution: Array<{
      country: string
      requests: number
      revenue: number
      percentage: number
    }>
    hourly_patterns: Array<{
      hour: number
      requests: number
      response_time: number
    }>
  }
  performance: {
    uptime_percentage: number
    avg_response_time: number
    error_rate: number
    cache_hit_rate: number
    throughput_rps: number
    p95_response_time: number
    p99_response_time: number
    sla_compliance: number
  }
  billing: {
    current_month_revenue: number
    outstanding_invoices: number
    overdue_amount: number
    collection_rate: number
    avg_contract_value: number
    customer_lifetime_value: number
    monthly_recurring_revenue: number
    annual_run_rate: number
  }
}

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d")
  const [selectedTenant, setSelectedTenant] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadAnalytics()
  }, [selectedTimeframe, selectedTenant])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        tenant_id: selectedTenant !== "all" ? selectedTenant : "",
        from: dateRange.from?.toISOString() || "",
        to: dateRange.to?.toISOString() || "",
      })

      const response = await fetch(`/api/admin/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data.analytics)
      }
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        tenant_id: selectedTenant !== "all" ? selectedTenant : "",
        format: "csv",
      })

      const response = await fetch(`/api/admin/analytics/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `analytics-${selectedTimeframe}-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to export data:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600"
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analytics & Billing Dashboard</CardTitle>
              <CardDescription>
                Comprehensive insights into platform usage, performance, and revenue metrics.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {/* This would be populated with actual tenants */}
                  <SelectItem value="tenant1">Airline Corp</SelectItem>
                  <SelectItem value="tenant2">Travel Express</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(analyticsData.overview.total_revenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              {getGrowthIcon(analyticsData.overview.revenue_growth)}
              <span
                className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.revenue_growth)}`}
              >
                {formatPercentage(Math.abs(analyticsData.overview.revenue_growth))} vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                <p className="text-2xl font-bold">
                  {formatNumber(analyticsData.overview.active_tenants)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              {getGrowthIcon(analyticsData.overview.tenant_growth)}
              <span
                className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.tenant_growth)}`}
              >
                {formatPercentage(Math.abs(analyticsData.overview.tenant_growth))} vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Calls</p>
                <p className="text-2xl font-bold">
                  {formatNumber(analyticsData.overview.total_api_calls)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              {getGrowthIcon(analyticsData.overview.api_growth)}
              <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.overview.api_growth)}`}>
                {formatPercentage(Math.abs(analyticsData.overview.api_growth))} vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{analyticsData.overview.avg_response_time}ms</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              {getGrowthIcon(-analyticsData.overview.performance_change)}
              <span
                className={`text-sm ml-1 ${getGrowthColor(-analyticsData.overview.performance_change)}`}
              >
                {formatPercentage(Math.abs(analyticsData.overview.performance_change))} vs last
                period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.revenue.monthly_breakdown.slice(-6).map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{month.month}</span>
                      <span className="font-medium">{formatCurrency(month.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.usage.top_tenants.slice(0, 5).map((tenant, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tenant.tenant_name}</p>
                        <p className="text-sm text-gray-600">
                          {formatNumber(tenant.api_calls)} calls
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(tenant.revenue)}</p>
                        <Badge variant={tenant.growth >= 0 ? "default" : "destructive"}>
                          {tenant.growth >= 0 ? "+" : ""}
                          {formatPercentage(tenant.growth)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uptime</span>
                    <span>{formatPercentage(analyticsData.performance.uptime_percentage)}</span>
                  </div>
                  <Progress value={analyticsData.performance.uptime_percentage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cache Hit Rate</span>
                    <span>{formatPercentage(analyticsData.performance.cache_hit_rate)}</span>
                  </div>
                  <Progress value={analyticsData.performance.cache_hit_rate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>SLA Compliance</span>
                    <span>{formatPercentage(analyticsData.performance.sla_compliance)}</span>
                  </div>
                  <Progress value={analyticsData.performance.sla_compliance} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.revenue.by_plan.map((plan, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{plan.plan}</span>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(plan.revenue)}</p>
                        <p className="text-xs text-gray-600">{plan.count} tenants</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.usage.geographic_distribution.slice(0, 5).map((country, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{country.country}</span>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(country.requests)}</p>
                        <p className="text-xs text-gray-600">
                          {formatPercentage(country.percentage)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analyticsData.billing.monthly_recurring_revenue)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Annual Run Rate</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analyticsData.billing.annual_run_rate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Customer LTV</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analyticsData.billing.customer_lifetime_value)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Churn Rate</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(analyticsData.revenue.churn_rate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Monthly revenue trends and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">Current Month</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(analyticsData.billing.current_month_revenue)}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">Forecasted ARR</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(analyticsData.revenue.forecasted_arr)}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-gray-600">Collection Rate</p>
                    <p className="text-xl font-bold">
                      {formatPercentage(analyticsData.billing.collection_rate)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Monthly Revenue History</h3>
                  <div className="space-y-2">
                    {analyticsData.revenue.monthly_breakdown.map((month, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <span>{month.month}</span>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(month.revenue)}</p>
                          <p className="text-sm text-gray-600">
                            {month.tenants} tenants • {formatNumber(month.api_calls)} calls
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoint Usage</CardTitle>
                <CardDescription>Most popular endpoints and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.usage.api_endpoints.map((endpoint, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{endpoint.endpoint}</span>
                        <Badge variant="outline">{formatNumber(endpoint.calls)} calls</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <span>Avg: {endpoint.avg_response_time.toFixed(0)}ms</span>
                        <span>Error: {formatPercentage(endpoint.error_rate)}</span>
                        <span>Revenue: {formatCurrency(endpoint.revenue_impact)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Usage Patterns</CardTitle>
                <CardDescription>Request volume and performance by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.usage.hourly_patterns.map((hour, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="text-sm">{hour.hour}:00</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">{formatNumber(hour.requests)} req</span>
                        <span className="text-sm text-gray-600">
                          {hour.response_time.toFixed(0)}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(analyticsData.performance.uptime_percentage)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">Avg Response</p>
                  <p className="text-2xl font-bold">
                    {analyticsData.performance.avg_response_time}ms
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm text-gray-600">Throughput</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(analyticsData.performance.throughput_rps)} RPS
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm text-gray-600">Error Rate</p>
                  <p className="text-2xl font-bold">
                    {formatPercentage(analyticsData.performance.error_rate)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Details</CardTitle>
              <CardDescription>Detailed performance metrics and SLA compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>P95 Response Time</span>
                      <span>{analyticsData.performance.p95_response_time}ms</span>
                    </div>
                    <Progress
                      value={Math.min(
                        (analyticsData.performance.p95_response_time / 1000) * 100,
                        100,
                      )}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>P99 Response Time</span>
                      <span>{analyticsData.performance.p99_response_time}ms</span>
                    </div>
                    <Progress
                      value={Math.min(
                        (analyticsData.performance.p99_response_time / 2000) * 100,
                        100,
                      )}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cache Hit Rate</span>
                      <span>{formatPercentage(analyticsData.performance.cache_hit_rate)}</span>
                    </div>
                    <Progress value={analyticsData.performance.cache_hit_rate} className="h-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded">
                    <h4 className="font-medium mb-2">SLA Targets</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Uptime Target</span>
                        <span
                          className={
                            analyticsData.performance.uptime_percentage >= 99.9
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          99.9% {analyticsData.performance.uptime_percentage >= 99.9 ? "✓" : "✗"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Response Time Target</span>
                        <span
                          className={
                            analyticsData.performance.avg_response_time <= 200
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          &lt;200ms {analyticsData.performance.avg_response_time <= 200 ? "✓" : "✗"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate Target</span>
                        <span
                          className={
                            analyticsData.performance.error_rate <= 0.1
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          &lt;0.1% {analyticsData.performance.error_rate <= 0.1 ? "✓" : "✗"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
