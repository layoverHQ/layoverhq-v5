"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react"

interface ProductionMetrics {
  uptime: number
  responseTime: number
  errorRate: number
  activeUsers: number
  requestsPerMinute: number
  memoryUsage: number
  cpuUsage: number
  diskUsage: number
}

interface ServiceStatus {
  name: string
  status: "healthy" | "degraded" | "unhealthy"
  responseTime: number
  uptime: string
  lastCheck: string
}

export function ProductionMonitoring() {
  const [metrics, setMetrics] = useState<ProductionMetrics>({
    uptime: 99.9,
    responseTime: 145,
    errorRate: 0.02,
    activeUsers: 1247,
    requestsPerMinute: 3420,
    memoryUsage: 68,
    cpuUsage: 45,
    diskUsage: 32,
  })

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: "Web Application",
      status: "healthy",
      responseTime: 145,
      uptime: "99.9%",
      lastCheck: "30s ago",
    },
    {
      name: "Database",
      status: "healthy",
      responseTime: 12,
      uptime: "99.8%",
      lastCheck: "1m ago",
    },
    {
      name: "Redis Cache",
      status: "healthy",
      responseTime: 3,
      uptime: "99.9%",
      lastCheck: "30s ago",
    },
    {
      name: "External APIs",
      status: "degraded",
      responseTime: 890,
      uptime: "98.1%",
      lastCheck: "2m ago",
    },
  ])

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const refreshMetrics = async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call to get real metrics
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update with slight variations to simulate real data
      setMetrics((prev) => ({
        ...prev,
        responseTime: prev.responseTime + (Math.random() - 0.5) * 20,
        activeUsers: prev.activeUsers + Math.floor((Math.random() - 0.5) * 50),
        requestsPerMinute: prev.requestsPerMinute + Math.floor((Math.random() - 0.5) * 200),
        memoryUsage: Math.max(0, Math.min(100, prev.memoryUsage + (Math.random() - 0.5) * 10)),
        cpuUsage: Math.max(0, Math.min(100, prev.cpuUsage + (Math.random() - 0.5) * 15)),
      }))

      setLastUpdate(new Date())
    } catch (error) {
      console.error("Failed to refresh metrics:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "unhealthy":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "degraded":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Degraded
          </Badge>
        )
      case "unhealthy":
        return <Badge variant="destructive">Unhealthy</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const overallStatus = services.every((s) => s.status === "healthy")
    ? "healthy"
    : services.some((s) => s.status === "unhealthy")
      ? "unhealthy"
      : "degraded"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Production Monitoring</h2>
          <p className="text-muted-foreground">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(overallStatus)}
            <span className="text-sm font-medium">
              System{" "}
              {overallStatus === "healthy"
                ? "Healthy"
                : overallStatus === "degraded"
                  ? "Degraded"
                  : "Unhealthy"}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button onClick={refreshMetrics} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      {overallStatus !== "healthy" && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some services are experiencing issues. Check the service status below for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.uptime.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.responseTime)}ms</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/min</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.requestsPerMinute.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current load</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Service Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {service.responseTime}ms • {service.uptime} uptime • {service.lastCheck}
                    </p>
                  </div>
                </div>
                {getStatusBadge(service.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current</span>
                <span>{Math.round(metrics.cpuUsage)}%</span>
              </div>
              <Progress value={metrics.cpuUsage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.cpuUsage < 70 ? "Normal" : metrics.cpuUsage < 90 ? "High" : "Critical"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current</span>
                <span>{Math.round(metrics.memoryUsage)}%</span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.memoryUsage < 80
                  ? "Normal"
                  : metrics.memoryUsage < 95
                    ? "High"
                    : "Critical"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current</span>
                <span>{Math.round(metrics.diskUsage)}%</span>
              </div>
              <Progress value={metrics.diskUsage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.diskUsage < 85 ? "Normal" : metrics.diskUsage < 95 ? "High" : "Critical"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
