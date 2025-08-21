"use client"

/**
 * Comprehensive Audit Logging and Monitoring Dashboard
 *
 * Real-time monitoring of system activities, security events, and configuration changes
 * with advanced filtering, alerting, and analytics capabilities.
 */

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertTriangle,
  Shield,
  Activity,
  Users,
  Settings,
  Database,
  Search,
  Download,
  RefreshCw,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Smartphone,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AuditLog {
  id: string
  event_type: string
  entity_type: string
  entity_id?: string
  action: string
  actor_id?: string
  actor_name?: string
  tenant_id?: string
  tenant_name?: string
  metadata: Record<string, any>
  ip_address?: string
  user_agent?: string
  session_id?: string
  risk_score: number
  created_at: string
}

interface SecurityEvent {
  id: string
  type:
    | "login"
    | "logout"
    | "failed_login"
    | "session_timeout"
    | "permission_denied"
    | "suspicious_activity"
  user_id?: string
  user_name?: string
  ip_address?: string
  user_agent?: string
  metadata: Record<string, any>
  risk_score: number
  created_at: string
}

interface SystemMetric {
  id: string
  metric_name: string
  value: number
  tags: Record<string, any>
  tenant_id?: string
  recorded_at: string
}

interface AuditFilters {
  event_type?: string
  entity_type?: string
  actor_id?: string
  tenant_id?: string
  date_from?: string
  date_to?: string
  risk_score_min?: number
  search_query?: string
}

interface DashboardStats {
  total_events_24h: number
  security_events_24h: number
  high_risk_events_24h: number
  unique_users_24h: number
  failed_logins_24h: number
  config_changes_24h: number
  avg_risk_score: number
  most_active_user: string
  most_accessed_resource: string
}

export default function AdminAuditDashboard() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [filters, setFilters] = useState<AuditFilters>({})
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState("overview")
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { toast } = useToast()

  /**
   * Load dashboard data
   */
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load dashboard stats
      const statsResponse = await fetch("/api/admin/audit/stats")
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setDashboardStats(stats)
      }

      // Load audit logs
      const auditResponse = await fetch(
        "/api/admin/audit/logs?" +
          new URLSearchParams({
            limit: "50",
            ...Object.fromEntries(
              Object.entries(filters).filter(([_, value]) => value !== undefined && value !== ""),
            ),
          }),
      )
      if (auditResponse.ok) {
        const auditData = await auditResponse.json()
        setAuditLogs(auditData)
      }

      // Load security events
      const securityResponse = await fetch("/api/admin/audit/security-events?limit=50")
      if (securityResponse.ok) {
        const securityData = await securityResponse.json()
        setSecurityEvents(securityData)
      }

      // Load system metrics
      const metricsResponse = await fetch("/api/admin/audit/metrics?limit=50")
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setSystemMetrics(metricsData)
      }

      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load audit data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  /**
   * Export audit logs
   */
  const exportAuditLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters, format: "csv" }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Audit logs exported successfully",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      console.error("Error exporting audit logs:", error)
      toast({
        title: "Error",
        description: "Failed to export audit logs",
        variant: "destructive",
      })
    }
  }

  /**
   * Get risk score badge variant
   */
  const getRiskScoreBadge = (score: number) => {
    if (score >= 8) return { variant: "destructive" as const, label: "Critical" }
    if (score >= 6) return { variant: "destructive" as const, label: "High" }
    if (score >= 4) return { variant: "default" as const, label: "Medium" }
    if (score >= 2) return { variant: "secondary" as const, label: "Low" }
    return { variant: "outline" as const, label: "Info" }
  }

  /**
   * Get event type icon
   */
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "security":
        return <Shield className="h-4 w-4" />
      case "configuration":
        return <Settings className="h-4 w-4" />
      case "api_credentials":
        return <Database className="h-4 w-4" />
      case "user_management":
        return <Users className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  /**
   * Format metadata for display
   */
  const formatMetadata = (metadata: Record<string, any>) => {
    const important = ["action", "resource", "reason", "error", "ip_address"]
    const filtered = Object.entries(metadata)
      .filter(([key]) => important.includes(key))
      .slice(0, 3)

    return filtered.map(([key, value]) => `${key}: ${value}`).join(", ")
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    if (autoRefresh) {
      interval = setInterval(() => {
        loadDashboardData()
      }, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, loadDashboardData])

  // Load data on component mount and filter changes
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit & Monitoring Dashboard</h1>
          <p className="text-gray-600">Real-time system monitoring and security audit trail</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Last updated: {lastRefresh.toLocaleTimeString()}</Badge>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto-refresh: {autoRefresh ? "On" : "Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={loadDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Events (24h)</p>
                  <p className="text-2xl font-bold">{dashboardStats.total_events_24h}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Security Events</p>
                  <p className="text-2xl font-bold">{dashboardStats.security_events_24h}</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Risk Events</p>
                  <p className="text-2xl font-bold">{dashboardStats.high_risk_events_24h}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Risk Score</p>
                  <p className="text-2xl font-bold">{dashboardStats.avg_risk_score.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="event-type">Event Type</Label>
              <Select
                value={filters.event_type || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, event_type: value || undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="configuration">Configuration</SelectItem>
                  <SelectItem value="api_credentials">API Credentials</SelectItem>
                  <SelectItem value="user_management">User Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="entity-type">Entity Type</Label>
              <Select
                value={filters.entity_type || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, entity_type: value || undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="configuration">Configuration</SelectItem>
                  <SelectItem value="credential">Credential</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="session">Session</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="datetime-local"
                value={filters.date_from || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, date_from: e.target.value || undefined }))
                }
              />
            </div>

            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search in metadata..."
                value={filters.search_query || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search_query: e.target.value || undefined }))
                }
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
            <Button onClick={exportAuditLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent High Risk Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  High Risk Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs
                    .filter((log) => log.risk_score >= 6)
                    .slice(0, 5)
                    .map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex items-center space-x-3">
                          {getEventTypeIcon(log.event_type)}
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-gray-600">
                              {log.actor_name || "System"} •{" "}
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge {...getRiskScoreBadge(log.risk_score)}>
                          {getRiskScoreBadge(log.risk_score).label}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Security Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center space-x-3">
                        {event.type === "failed_login" ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium capitalize">{event.type.replace("_", " ")}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            {event.ip_address && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.ip_address}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(event.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge {...getRiskScoreBadge(event.risk_score)}>
                        {getRiskScoreBadge(event.risk_score).label}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Detailed system activity logs with metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getEventTypeIcon(log.event_type)}
                          <span className="font-medium">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.actor_name || "System"}</p>
                          {log.ip_address && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {log.ip_address}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.entity_type}</p>
                          {log.entity_id && (
                            <p className="text-sm text-gray-600">
                              {log.entity_id.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {formatMetadata(log.metadata)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge {...getRiskScoreBadge(log.risk_score)}>{log.risk_score}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(log.created_at).toLocaleDateString()}</p>
                          <p className="text-gray-600">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Authentication and security-related events</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {event.type === "failed_login" ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium capitalize">
                            {event.type.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{event.user_name || "Unknown"}</p>
                      </TableCell>
                      <TableCell>
                        {event.ip_address && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-sm">{event.ip_address}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.user_agent && (
                          <div className="flex items-center">
                            <Smartphone className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-sm max-w-xs truncate">{event.user_agent}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge {...getRiskScoreBadge(event.risk_score)}>{event.risk_score}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(event.created_at).toLocaleDateString()}</p>
                          <p className="text-gray-600">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics</CardTitle>
              <CardDescription>Performance and system health metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Recorded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemMetrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell>
                        <span className="font-medium">{metric.metric_name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{metric.value}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(metric.tags)
                            .slice(0, 3)
                            .map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {value as string}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {metric.tenant_id ? (
                          <Badge variant="outline">{metric.tenant_id.substring(0, 8)}...</Badge>
                        ) : (
                          <span className="text-gray-400">Global</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(metric.recorded_at).toLocaleDateString()}</p>
                          <p className="text-gray-600">
                            {new Date(metric.recorded_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
