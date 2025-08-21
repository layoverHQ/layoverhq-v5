"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Users, Database, Cpu, HardDrive, Wifi } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SystemMetric {
  id: string
  metric_name: string
  metric_value: number
  metric_unit: string
  tags: any
  created_at: string
}

interface DashboardMetrics {
  activeUsers: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkLatency: number
  databaseConnections: number
}

export function RealtimeDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeUsers: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    databaseConnections: 0,
  })
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial metrics
    fetchLatestMetrics()

    // Subscribe to real-time metrics updates
    const channel = supabase
      .channel("system_metrics")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "system_metrics",
        },
        (payload) => {
          const newMetric = payload.new as SystemMetric
          updateMetric(newMetric)
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchLatestMetrics = async () => {
    const metricNames = [
      "active_users",
      "cpu_usage",
      "memory_usage",
      "disk_usage",
      "network_latency",
      "database_connections",
    ]

    for (const metricName of metricNames) {
      const { data, error } = await supabase
        .from("system_metrics")
        .select("*")
        .eq("metric_name", metricName)
        .order("created_at", { ascending: false })
        .limit(1)

      if (!error && data && data.length > 0) {
        updateMetric(data[0])
      }
    }
  }

  const updateMetric = (metric: SystemMetric) => {
    setMetrics((prev) => {
      const updated = { ...prev }
      switch (metric.metric_name) {
        case "active_users":
          updated.activeUsers = metric.metric_value
          break
        case "cpu_usage":
          updated.cpuUsage = metric.metric_value
          break
        case "memory_usage":
          updated.memoryUsage = metric.metric_value
          break
        case "disk_usage":
          updated.diskUsage = metric.metric_value
          break
        case "network_latency":
          updated.networkLatency = metric.metric_value
          break
        case "database_connections":
          updated.databaseConnections = metric.metric_value
          break
      }
      return updated
    })
  }

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "destructive"
    if (value >= thresholds.warning) return "secondary"
    return "default"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-time System Metrics</h3>
        <Badge variant={isConnected ? "default" : "destructive"}>
          <Wifi className="h-3 w-3 mr-1" />
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{metrics.cpuUsage.toFixed(1)}%</div>
              <Badge variant={getStatusColor(metrics.cpuUsage, { warning: 70, critical: 90 })}>
                {metrics.cpuUsage >= 90 ? "Critical" : metrics.cpuUsage >= 70 ? "High" : "Normal"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">System load</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</div>
              <Badge variant={getStatusColor(metrics.memoryUsage, { warning: 80, critical: 95 })}>
                {metrics.memoryUsage >= 95
                  ? "Critical"
                  : metrics.memoryUsage >= 80
                    ? "High"
                    : "Normal"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">RAM utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{metrics.diskUsage.toFixed(1)}%</div>
              <Badge variant={getStatusColor(metrics.diskUsage, { warning: 85, critical: 95 })}>
                {metrics.diskUsage >= 95 ? "Critical" : metrics.diskUsage >= 85 ? "High" : "Normal"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Storage used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.networkLatency.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.databaseConnections}</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
