/**
 * Enterprise Admin Dashboard - Zero-CLI Administration System
 *
 * Comprehensive dashboard for enterprise administrators to manage
 * multi-tenant configurations, monitor system health, and configure
 * white-label settings without any CLI access.
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Users,
  Activity,
  Database,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react"

import ConfigurationPanel from "@/components/enterprise/configuration-panel"
import TenantManagement from "@/components/enterprise/tenant-management"
import WhiteLabelManager from "@/components/enterprise/white-label-manager"
import SystemMonitoring from "@/components/enterprise/system-monitoring"
import SecurityCenter from "@/components/enterprise/security-center"
import AnalyticsDashboard from "@/components/enterprise/analytics-dashboard"

interface SystemHealth {
  overall: "healthy" | "warning" | "critical"
  api_gateway: "healthy" | "warning" | "critical"
  database: "healthy" | "warning" | "critical"
  cache: "healthy" | "warning" | "critical"
  integrations: "healthy" | "warning" | "critical"
}

interface SystemMetrics {
  active_tenants: number
  total_users: number
  api_requests_24h: number
  response_time_avg: number
  error_rate: number
  cache_hit_rate: number
  uptime_percentage: number
  revenue_this_month: number
}

interface RealtimeAlert {
  id: string
  type: "info" | "warning" | "error"
  title: string
  message: string
  timestamp: string
  dismissed: boolean
}

export default function EnterpriseAdminDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: "healthy",
    api_gateway: "healthy",
    database: "healthy",
    cache: "healthy",
    integrations: "healthy",
  })

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    active_tenants: 47,
    total_users: 12847,
    api_requests_24h: 2847293,
    response_time_avg: 142,
    error_rate: 0.02,
    cache_hit_rate: 94.7,
    uptime_percentage: 99.97,
    revenue_this_month: 324750,
  })

  const [alerts, setAlerts] = useState<RealtimeAlert[]>([
    {
      id: "1",
      type: "warning",
      title: "High API Usage",
      message: 'Tenant "AirlineCorp" approaching rate limit (85% of quota)',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      dismissed: false,
    },
    {
      id: "2",
      type: "info",
      title: "System Update Available",
      message: "New configuration schema version available for deployment",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      dismissed: false,
    },
  ])

  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize real-time monitoring
    const initializeMonitoring = async () => {
      try {
        // Load initial system state
        await Promise.all([loadSystemHealth(), loadSystemMetrics(), loadRealtimeAlerts()])

        // Set up WebSocket for real-time updates
        setupRealtimeUpdates()

        setIsLoading(false)
      } catch (error) {
        console.error("Failed to initialize admin dashboard:", error)
        setIsLoading(false)
      }
    }

    initializeMonitoring()

    // Cleanup on unmount
    return () => {
      // Close WebSocket connections
    }
  }, [])

  const loadSystemHealth = async () => {
    try {
      const response = await fetch("/api/admin/system/health")
      if (response.ok) {
        const health = await response.json()
        setSystemHealth(health)
      }
    } catch (error) {
      console.error("Failed to load system health:", error)
    }
  }

  const loadSystemMetrics = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/metrics")
      if (response.ok) {
        const metrics = await response.json()
        setSystemMetrics(metrics)
      }
    } catch (error) {
      console.error("Failed to load system metrics:", error)
    }
  }

  const loadRealtimeAlerts = async () => {
    try {
      const response = await fetch("/api/admin/alerts/active")
      if (response.ok) {
        const alertsData = await response.json()
        setAlerts(alertsData)
      }
    } catch (error) {
      console.error("Failed to load alerts:", error)
    }
  }

  const setupRealtimeUpdates = () => {
    // WebSocket setup for real-time system monitoring
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001")

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case "system_health_update":
          setSystemHealth(data.payload)
          break
        case "metrics_update":
          setSystemMetrics(data.payload)
          break
        case "new_alert":
          setAlerts((prev) => [data.payload, ...prev])
          break
        case "config_changed":
          // Handle configuration changes
          break
      }
    }

    return ws
  }

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, dismissed: true } : alert)),
    )
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Enterprise Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enterprise Control Center</h1>
              <p className="text-gray-600 mt-1">Zero-CLI administration for LayoverHQ platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={systemHealth.overall === "healthy" ? "default" : "destructive"}>
                {systemHealth.overall.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Live Monitoring
              </Button>
            </div>
          </div>
        </div>

        {/* Real-time Alerts */}
        {alerts.filter((alert) => !alert.dismissed).length > 0 && (
          <div className="space-y-2">
            {alerts
              .filter((alert) => !alert.dismissed)
              .map((alert) => (
                <Alert
                  key={alert.id}
                  className={
                    alert.type === "error"
                      ? "border-red-200 bg-red-50"
                      : alert.type === "warning"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-blue-200 bg-blue-50"
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {alert.type === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      {alert.type === "warning" && (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      {alert.type === "info" && <CheckCircle className="h-4 w-4 text-blue-600" />}
                      <AlertDescription>
                        <span className="font-medium">{alert.title}:</span> {alert.message}
                      </AlertDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)}>
                      Dismiss
                    </Button>
                  </div>
                </Alert>
              ))}
          </div>
        )}

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemHealth.database)}
                <span className={`text-sm font-medium ${getHealthColor(systemHealth.database)}`}>
                  {systemHealth.database.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                API Gateway
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemHealth.api_gateway)}
                <span className={`text-sm font-medium ${getHealthColor(systemHealth.api_gateway)}`}>
                  {systemHealth.api_gateway.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Cache Layer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemHealth.cache)}
                <span className={`text-sm font-medium ${getHealthColor(systemHealth.cache)}`}>
                  {systemHealth.cache.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemHealth.integrations)}
                <span
                  className={`text-sm font-medium ${getHealthColor(systemHealth.integrations)}`}
                >
                  {systemHealth.integrations.toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.active_tenants}</div>
              <p className="text-xs text-gray-600 mt-1">Enterprise customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.total_users.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">Across all tenants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">API Requests (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemMetrics.api_requests_24h.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Avg response: {systemMetrics.response_time_avg}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <DollarSign className="h-5 w-5 mr-1" />
                {systemMetrics.revenue_this_month.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">Monthly recurring revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-2xl font-bold">{systemMetrics.uptime_percentage}%</span>
                  <Badge variant="default">SLA Met</Badge>
                </div>
                <Progress value={systemMetrics.uptime_percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-2xl font-bold">{systemMetrics.error_rate}%</span>
                  <Badge variant="default">Low</Badge>
                </div>
                <Progress value={systemMetrics.error_rate * 50} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-2xl font-bold">{systemMetrics.cache_hit_rate}%</span>
                  <Badge variant="default">Optimal</Badge>
                </div>
                <Progress value={systemMetrics.cache_hit_rate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Tenants</span>
            </TabsTrigger>
            <TabsTrigger value="white-label" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>White Label</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SystemMonitoring />
          </TabsContent>

          <TabsContent value="config">
            <ConfigurationPanel />
          </TabsContent>

          <TabsContent value="tenants">
            <TenantManagement />
          </TabsContent>

          <TabsContent value="white-label">
            <WhiteLabelManager />
          </TabsContent>

          <TabsContent value="security">
            <SecurityCenter />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
