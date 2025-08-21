"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Cpu,
  Database,
  Globe,
  Zap,
  Users,
  DollarSign,
  Clock,
  Server,
  Shield,
  Settings,
  RefreshCw,
  Bell,
  Eye,
  BarChart3,
} from "lucide-react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface SystemHealth {
  status: "healthy" | "degraded" | "down" | "maintenance"
  uptime: number
  lastCheck: Date
  services: ServiceHealth[]
  alerts: SystemAlert[]
  metrics: SystemMetrics
}

interface ServiceHealth {
  id: string
  name: string
  status: "healthy" | "degraded" | "down"
  responseTime: number
  errorRate: number
  uptime: number
  lastCheck: Date
  dependencies: string[]
  endpoints: EndpointHealth[]
}

interface EndpointHealth {
  path: string
  method: string
  status: "healthy" | "degraded" | "down"
  responseTime: number
  successRate: number
  rateLimitStatus: {
    current: number
    limit: number
    resetTime: Date
  }
}

interface SystemAlert {
  id: string
  type: "system" | "performance" | "business" | "security"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  service?: string
  metric: string
  currentValue: any
  status: "active" | "acknowledged" | "resolved"
  createdAt: Date
}

interface SystemMetrics {
  api: {
    totalRequests: number
    requestsPerSecond: number
    averageResponseTime: number
    errorRate: number
    rateLimitHits: number
  }
  database: {
    connectionCount: number
    queryLatency: number
    storageUsage: {
      total: number
      used: number
      percentage: number
    }
  }
  cache: {
    hitRate: number
    memoryUsage: number
    connectionCount: number
  }
  infrastructure: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkLatency: number
  }
  business: {
    activeUsers: number
    bookingsPerHour: number
    revenuePerHour: number
    conversionRate: number
    customerSatisfaction: number
  }
}

interface MonitoringDashboardProps {
  userRole: "admin" | "sre" | "engineer" | "viewer"
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function ProductionMonitoringDashboard({ userRole }: MonitoringDashboardProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadSystemHealth()

    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(loadSystemHealth, refreshInterval * 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const loadSystemHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/v1/monitoring/health")
      const data = await response.json()
      setSystemHealth(data.systemHealth)
    } catch (error) {
      console.error("Failed to load system health:", error)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/v1/monitoring/alerts/${alertId}/acknowledge`, {
        method: "POST",
      })
      loadSystemHealth()
    } catch (error) {
      console.error("Failed to acknowledge alert:", error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: "text-green-600 bg-green-100",
      degraded: "text-yellow-600 bg-yellow-100",
      down: "text-red-600 bg-red-100",
      maintenance: "text-blue-600 bg-blue-100",
    }
    return colors[status as keyof typeof colors] || colors.degraded
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      healthy: CheckCircle,
      degraded: AlertTriangle,
      down: XCircle,
      maintenance: Settings,
    }
    const IconComponent = icons[status as keyof typeof icons] || AlertTriangle
    return <IconComponent className="h-4 w-4" />
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

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`
  }

  const formatBytes = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    if (bytes === 0) return "0 B"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system health...</p>
        </div>
      </div>
    )
  }

  if (!systemHealth) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>System Health Unavailable</AlertTitle>
        <AlertDescription>
          Unable to load system health data. Please check the monitoring service.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Monitoring</h1>
          <p className="text-gray-600">Real-time system health and performance monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button variant="outline" size="sm" onClick={loadSystemHealth}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getStatusIcon(systemHealth.status)}
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(systemHealth.status)}>
              {systemHealth.status.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Uptime: {formatUptime(systemHealth.uptime)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.alerts.filter((a) => a.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.alerts.filter((a) => a.severity === "critical").length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Health</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemHealth.services.filter((s) => s.status === "healthy").length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {systemHealth.services.length} services healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth.metrics.api.averageResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {systemHealth.metrics.api.requestsPerSecond.toFixed(1)} req/s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {systemHealth.alerts.filter((a) => a.status === "active" && a.severity === "critical")
        .length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-red-600">Critical Alerts</h3>
          {systemHealth.alerts
            .filter((a) => a.status === "active" && a.severity === "critical")
            .map((alert) => (
              <Alert key={alert.id} className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex justify-between items-start">
                  <div>
                    <AlertTitle className="text-red-800">{alert.title}</AlertTitle>
                    <AlertDescription className="text-red-700">
                      {alert.description}
                      {alert.service && ` (Service: ${alert.service})`}
                    </AlertDescription>
                  </div>
                  {userRole !== "viewer" && (
                    <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                      Acknowledge
                    </Button>
                  )}
                </div>
              </Alert>
            ))}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="business">Business KPIs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
                <CardDescription>Request volume and response times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time</span>
                    <span className="font-semibold">
                      {systemHealth.metrics.api.averageResponseTime}ms
                    </span>
                  </div>
                  <Progress value={(2000 - systemHealth.metrics.api.averageResponseTime) / 20} />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-semibold text-red-600">
                      {systemHealth.metrics.api.errorRate}%
                    </span>
                  </div>
                  <Progress value={100 - systemHealth.metrics.api.errorRate * 10} />

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {systemHealth.metrics.api.requestsPerSecond.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Requests/sec</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {systemHealth.metrics.api.totalRequests.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total today</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>Infrastructure utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <Cpu className="h-4 w-4 mr-2" />
                      CPU Usage
                    </span>
                    <span className="font-semibold">
                      {systemHealth.metrics.infrastructure.cpuUsage}%
                    </span>
                  </div>
                  <Progress value={systemHealth.metrics.infrastructure.cpuUsage} />

                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Memory Usage
                    </span>
                    <span className="font-semibold">
                      {systemHealth.metrics.infrastructure.memoryUsage}%
                    </span>
                  </div>
                  <Progress value={systemHealth.metrics.infrastructure.memoryUsage} />

                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center">
                      <Server className="h-4 w-4 mr-2" />
                      Disk Usage
                    </span>
                    <span className="font-semibold">
                      {systemHealth.metrics.infrastructure.diskUsage}%
                    </span>
                  </div>
                  <Progress value={systemHealth.metrics.infrastructure.diskUsage} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Database and Cache Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
                <CardDescription>Query latency and storage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Query Latency</span>
                    <span className="font-semibold">
                      {systemHealth.metrics.database.queryLatency}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Connections</span>
                    <span className="font-semibold">
                      {systemHealth.metrics.database.connectionCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Storage Used</span>
                    <span className="font-semibold">
                      {formatBytes(systemHealth.metrics.database.storageUsage.used)} /{" "}
                      {formatBytes(systemHealth.metrics.database.storageUsage.total)}
                    </span>
                  </div>
                  <Progress value={systemHealth.metrics.database.storageUsage.percentage} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
                <CardDescription>Hit rate and memory usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hit Rate</span>
                    <span className="font-semibold text-green-600">
                      {systemHealth.metrics.cache.hitRate}%
                    </span>
                  </div>
                  <Progress value={systemHealth.metrics.cache.hitRate} />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory Usage</span>
                    <span className="font-semibold">{systemHealth.metrics.cache.memoryUsage}%</span>
                  </div>
                  <Progress value={systemHealth.metrics.cache.memoryUsage} />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Connections</span>
                    <span className="font-semibold">
                      {systemHealth.metrics.cache.connectionCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {/* Services Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemHealth.services.map((service) => (
              <Card
                key={service.id}
                className={`border-2 ${
                  service.status === "healthy"
                    ? "border-green-200"
                    : service.status === "degraded"
                      ? "border-yellow-200"
                      : "border-red-200"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{service.name}</CardTitle>
                    <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time:</span>
                      <span className="font-semibold">{service.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Error Rate:</span>
                      <span
                        className={`font-semibold ${service.errorRate > 5 ? "text-red-600" : "text-green-600"}`}
                      >
                        {service.errorRate}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Uptime:</span>
                      <span className="font-semibold">{formatUptime(service.uptime)}</span>
                    </div>
                    {service.dependencies.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">Dependencies:</div>
                        <div className="flex flex-wrap gap-1">
                          {service.dependencies.map((dep) => (
                            <Badge key={dep} variant="secondary" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Service Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints Health</CardTitle>
              <CardDescription>Detailed endpoint monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemHealth.services
                  .filter((s) => s.endpoints.length > 0)
                  .flatMap((s) => s.endpoints.map((e) => ({ ...e, serviceName: s.name })))
                  .map((endpoint, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{endpoint.method}</Badge>
                        <span className="font-mono text-sm">{endpoint.path}</span>
                        <Badge className={getStatusColor(endpoint.status)}>{endpoint.status}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="text-gray-600">Response: </span>
                          <span className="font-semibold">
                            {endpoint.responseTime.toFixed(0)}ms
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Success: </span>
                          <span className="font-semibold">{endpoint.successRate.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Rate Limit: </span>
                          <span className="font-semibold">
                            {endpoint.rateLimitStatus.current}/{endpoint.rateLimitStatus.limit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          {/* Infrastructure Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.infrastructure.cpuUsage}%
                </div>
                <Progress value={systemHealth.metrics.infrastructure.cpuUsage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {systemHealth.metrics.infrastructure.cpuUsage > 80 ? "High usage" : "Normal"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.infrastructure.memoryUsage}%
                </div>
                <Progress
                  value={systemHealth.metrics.infrastructure.memoryUsage}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {systemHealth.metrics.infrastructure.memoryUsage > 85 ? "High usage" : "Normal"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.infrastructure.diskUsage}%
                </div>
                <Progress value={systemHealth.metrics.infrastructure.diskUsage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {systemHealth.metrics.infrastructure.diskUsage > 90 ? "Low space" : "Normal"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.infrastructure.networkLatency}ms
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {systemHealth.metrics.infrastructure.networkLatency > 100
                    ? "High latency"
                    : "Normal"}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          {/* Business KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.business.activeUsers}
                </div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bookings/Hour</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.business.bookingsPerHour}
                </div>
                <p className="text-xs text-muted-foreground">Last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue/Hour</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${systemHealth.metrics.business.revenuePerHour.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">Last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.business.conversionRate}%
                </div>
                <p className="text-xs text-muted-foreground">Search to booking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth.metrics.business.customerSatisfaction}/5
                </div>
                <p className="text-xs text-muted-foreground">Average rating</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {/* Alert Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>System Alerts</CardTitle>
                  <CardDescription>All system alerts and their status</CardDescription>
                </div>
                <Badge variant="secondary">{systemHealth.alerts.length} total</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemHealth.alerts.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No alerts to display</p>
                ) : (
                  systemHealth.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        <div>
                          <div className="font-semibold">{alert.title}</div>
                          <div className="text-sm text-gray-600">{alert.description}</div>
                          {alert.service && (
                            <div className="text-xs text-gray-500 mt-1">
                              Service: {alert.service}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(alert.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={alert.status === "active" ? "destructive" : "secondary"}>
                          {alert.status}
                        </Badge>
                        {alert.status === "active" && userRole !== "viewer" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
