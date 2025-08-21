"use client"

/**
 * Zero-CLI Admin Dashboard - Complete Enterprise Configuration System
 *
 * Comprehensive dashboard that allows enterprise administrators to configure
 * everything through the UI without SSH, environment changes, or code deployments.
 * Features real-time monitoring, configuration management, and white-label support.
 */

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Settings,
  Monitor,
  Users,
  Key,
  Palette,
  Globe,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Cloud,
  Server,
  Gauge,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Bell,
  Wifi,
} from "lucide-react"

// Import existing components
import AdminConfigInterface from "@/components/admin-config-interface"
import TenantManagement from "@/components/enterprise/tenant-management"
import WhiteLabelManager from "@/components/enterprise/white-label-manager"
import ApiCredentialsManager from "@/components/enterprise/api-credentials-manager"
import AnalyticsDashboard from "@/components/enterprise/analytics-dashboard"

interface SystemMetrics {
  uptime: number
  response_time_ms: number
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  active_connections: number
  error_rate: number
  throughput_rps: number
}

interface AlertInfo {
  id: string
  type: "error" | "warning" | "info"
  title: string
  message: string
  timestamp: string
  resolved?: boolean
}

export default function ZeroCLIAdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    uptime: 99.9,
    response_time_ms: 145,
    cpu_usage: 23,
    memory_usage: 67,
    disk_usage: 43,
    active_connections: 1847,
    error_rate: 0.02,
    throughput_rps: 234,
  })
  const [alerts, setAlerts] = useState<AlertInfo[]>([
    {
      id: "1",
      type: "warning",
      title: "High Memory Usage",
      message: "Memory usage is above 80% on production servers",
      timestamp: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      type: "info",
      title: "Configuration Updated",
      message: "Rate limiting configuration has been updated successfully",
      timestamp: "2024-01-15T09:15:00Z",
      resolved: true,
    },
  ])
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics((prev) => ({
        ...prev,
        response_time_ms: Math.round(prev.response_time_ms + (Math.random() - 0.5) * 20),
        cpu_usage: Math.max(0, Math.min(100, prev.cpu_usage + (Math.random() - 0.5) * 10)),
        memory_usage: Math.max(0, Math.min(100, prev.memory_usage + (Math.random() - 0.5) * 5)),
        active_connections: Math.max(
          0,
          prev.active_connections + Math.round((Math.random() - 0.5) * 50),
        ),
        throughput_rps: Math.max(0, prev.throughput_rps + Math.round((Math.random() - 0.5) * 20)),
      }))
      setLastUpdate(new Date())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "text-red-600"
    if (value >= thresholds.warning) return "text-yellow-600"
    return "text-green-600"
  }

  const getProgressColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "bg-red-500"
    if (value >= thresholds.warning) return "bg-yellow-500"
    return "bg-green-500"
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Banner */}
      <div
        className={`p-4 rounded-lg border ${isOnline ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
            ></div>
            <div>
              <h3 className="font-semibold">
                {isOnline ? "All Systems Operational" : "System Issues Detected"}
              </h3>
              <p className="text-sm text-gray-600">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Issues"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setLastUpdate(new Date())}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-green-600">{systemMetrics.uptime}%</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p
                  className={`text-2xl font-bold ${getMetricColor(systemMetrics.response_time_ms, { warning: 200, critical: 500 })}`}
                >
                  {systemMetrics.response_time_ms}ms
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">
                  {systemMetrics.active_connections.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Throughput</p>
                <p className="text-2xl font-bold">{systemMetrics.throughput_rps} RPS</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span
                  className={`text-sm font-semibold ${getMetricColor(systemMetrics.cpu_usage, { warning: 70, critical: 90 })}`}
                >
                  {systemMetrics.cpu_usage}%
                </span>
              </div>
              <Progress
                value={systemMetrics.cpu_usage}
                className="h-2"
                style={{
                  background:
                    systemMetrics.cpu_usage >= 90
                      ? "#fee2e2"
                      : systemMetrics.cpu_usage >= 70
                        ? "#fef3c7"
                        : "#dcfce7",
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span
                  className={`text-sm font-semibold ${getMetricColor(systemMetrics.memory_usage, { warning: 80, critical: 95 })}`}
                >
                  {systemMetrics.memory_usage}%
                </span>
              </div>
              <Progress
                value={systemMetrics.memory_usage}
                className="h-2"
                style={{
                  background:
                    systemMetrics.memory_usage >= 95
                      ? "#fee2e2"
                      : systemMetrics.memory_usage >= 80
                        ? "#fef3c7"
                        : "#dcfce7",
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disk Usage</span>
                <span
                  className={`text-sm font-semibold ${getMetricColor(systemMetrics.disk_usage, { warning: 80, critical: 95 })}`}
                >
                  {systemMetrics.disk_usage}%
                </span>
              </div>
              <Progress
                value={systemMetrics.disk_usage}
                className="h-2"
                style={{
                  background:
                    systemMetrics.disk_usage >= 95
                      ? "#fee2e2"
                      : systemMetrics.disk_usage >= 80
                        ? "#fef3c7"
                        : "#dcfce7",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              System Alerts
            </CardTitle>
            <Badge variant="outline">
              {alerts.filter((alert) => !alert.resolved).length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.type === "error"
                    ? "border-red-200 bg-red-50"
                    : alert.type === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-blue-200 bg-blue-50"
                } ${alert.resolved ? "opacity-60" : ""}`}
              >
                <div className="flex items-center space-x-3">
                  {alert.type === "error" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {alert.type === "warning" && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  {alert.type === "info" && <CheckCircle className="h-4 w-4 text-blue-500" />}
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                  {alert.resolved && (
                    <Badge variant="outline" className="mt-1">
                      Resolved
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => setActiveTab("configuration")}
            >
              <Settings className="h-6 w-6 mb-2" />
              <span>Configuration</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => setActiveTab("tenants")}
            >
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Tenants</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => setActiveTab("whitelabel")}
            >
              <Palette className="h-6 w-6 mb-2" />
              <span>White Label</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => setActiveTab("api")}
            >
              <Key className="h-6 w-6 mb-2" />
              <span>API Keys</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zero-CLI Admin Dashboard</h1>
          <p className="text-gray-600">
            Complete enterprise configuration and monitoring without SSH or deployments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-full">
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">Connected</span>
          </div>
          <Badge variant="outline">Enterprise v2.0</Badge>
        </div>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Config</span>
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Tenants</span>
          </TabsTrigger>
          <TabsTrigger value="whitelabel" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <AdminConfigInterface />
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <TenantManagement />
        </TabsContent>

        <TabsContent value="whitelabel" className="space-y-6">
          <WhiteLabelManager />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <ApiCredentialsManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
