"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert as UIAlert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  Server,
  Users,
  TrendingUp,
  Shield,
  Wifi,
} from "lucide-react"

interface SystemMetrics {
  uptime: number
  responseTime: number
  errorRate: number
  activeUsers: number
  totalBookings: number
  revenue: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkLatency: number
}

interface SystemAlert {
  id: string
  type: "error" | "warning" | "info"
  message: string
  timestamp: string
  resolved: boolean
}

export default function ProductionDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: 99.9,
    responseTime: 245,
    errorRate: 0.02,
    activeUsers: 1247,
    totalBookings: 8934,
    revenue: 234567,
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 38,
    networkLatency: 12,
  })

  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: "1",
      type: "warning",
      message: "High memory usage detected on server-2",
      timestamp: "2024-01-20T10:30:00Z",
      resolved: false,
    },
    {
      id: "2",
      type: "info",
      message: "Scheduled maintenance completed successfully",
      timestamp: "2024-01-20T09:15:00Z",
      resolved: true,
    },
  ])

  const [backups, setBackups] = useState([
    {
      backup_id: "backup_2024-01-20T02-00-00",
      status: "completed",
      created_at: "2024-01-20T02:00:00Z",
      size: "2.4GB",
    },
    {
      backup_id: "backup_2024-01-19T02-00-00",
      status: "completed",
      created_at: "2024-01-19T02:00:00Z",
      size: "2.3GB",
    },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time metrics updates
      setMetrics((prev) => ({
        ...prev,
        responseTime: Math.floor(Math.random() * 100) + 200,
        activeUsers: Math.floor(Math.random() * 200) + 1200,
        cpuUsage: Math.floor(Math.random() * 30) + 40,
        memoryUsage: Math.floor(Math.random() * 20) + 55,
        networkLatency: Math.floor(Math.random() * 10) + 8,
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const createBackup = async () => {
    try {
      const response = await fetch("/api/v1/system/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      })

      const result = await response.json()
      if (result.success) {
        // Refresh backup list
        console.log("Backup created successfully")
      }
    } catch (error) {
      console.error("Failed to create backup:", error)
    }
  }

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "text-red-500"
    if (value >= thresholds.warning) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Production Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            System Healthy
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.uptime}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(metrics.responseTime, { warning: 500, critical: 1000 })}`}
            >
              {metrics.responseTime}ms
            </div>
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
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(metrics.errorRate * 100, { warning: 1, critical: 5 })}`}
            >
              {(metrics.errorRate * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  Server Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span
                      className={getStatusColor(metrics.cpuUsage, { warning: 70, critical: 90 })}
                    >
                      {metrics.cpuUsage}%
                    </span>
                  </div>
                  <Progress value={metrics.cpuUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span
                      className={getStatusColor(metrics.memoryUsage, { warning: 80, critical: 95 })}
                    >
                      {metrics.memoryUsage}%
                    </span>
                  </div>
                  <Progress value={metrics.memoryUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disk Usage</span>
                    <span
                      className={getStatusColor(metrics.diskUsage, { warning: 80, critical: 95 })}
                    >
                      {metrics.diskUsage}%
                    </span>
                  </div>
                  <Progress value={metrics.diskUsage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wifi className="w-5 h-5 mr-2" />
                  Network & Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Network Latency</span>
                  <span
                    className={`text-sm font-medium ${getStatusColor(metrics.networkLatency, { warning: 50, critical: 100 })}`}
                  >
                    {metrics.networkLatency}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Bookings</span>
                  <span className="text-sm font-medium">
                    {metrics.totalBookings.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Revenue (24h)</span>
                  <span className="text-sm font-medium">${metrics.revenue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-2">
            {alerts.map((alert) => (
              <UIAlert
                key={alert.id}
                className={
                  alert.type === "error"
                    ? "border-red-200"
                    : alert.type === "warning"
                      ? "border-yellow-200"
                      : "border-blue-200"
                }
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span>{alert.message}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={alert.resolved ? "secondary" : "destructive"}>
                      {alert.resolved ? "Resolved" : "Active"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </AlertDescription>
              </UIAlert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Database Backups</h3>
            <Button onClick={createBackup}>
              <Database className="w-4 h-4 mr-2" />
              Create Backup
            </Button>
          </div>
          <div className="space-y-2">
            {backups.map((backup) => (
              <Card key={backup.backup_id}>
                <CardContent className="flex justify-between items-center p-4">
                  <div>
                    <p className="font-medium">{backup.backup_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(backup.created_at).toLocaleString()} • {backup.size}
                    </p>
                  </div>
                  <Badge variant={backup.status === "completed" ? "secondary" : "destructive"}>
                    {backup.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">SSL Certificate</span>
                  <Badge variant="secondary">Valid</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rate Limiting</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">DDoS Protection</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">WAF Status</span>
                  <Badge variant="secondary">Protected</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Failed login attempts</span>
                    <span className="text-yellow-600">23 (last 24h)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blocked IPs</span>
                    <span className="text-red-600">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>API rate limits hit</span>
                    <span className="text-blue-600">142</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
