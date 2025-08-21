"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Database,
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Shield,
  Globe,
  Zap,
  HardDrive,
} from "lucide-react"

interface ServiceStatus {
  id: string
  name: string
  type: "api" | "database" | "queue" | "cache" | "auth" | "storage"
  status: "running" | "stopped" | "error" | "maintenance"
  uptime: string
  cpu: number
  memory: number
  requests: number
  errors: number
  lastRestart: string
  version: string
  port?: number
  url?: string
}

interface LogEntry {
  id: string
  service: string
  level: "info" | "warn" | "error" | "debug"
  message: string
  timestamp: string
  details?: any
}

export default function BackendServicesManagement() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    const fetchServices = async () => {
      console.log("[v0] Fetching services data...")
      try {
        const response = await fetch("/api/v1/system/services")
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Services data received:", data.services?.length || 0, "services")
          if (data.services && data.services.length > 0) {
            setServices(data.services)
            setLastUpdate(new Date())
          }
        }
      } catch (error) {
        console.error("[v0] Failed to fetch services:", error)
      }
    }

    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/v1/system/logs?limit=50")
        if (response.ok) {
          const data = await response.json()
          setLogs(data.logs || [])
        }
      } catch (error) {
        console.error("[v0] Failed to fetch logs:", error)
      }
    }

    fetchServices()
    fetchLogs()
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(async () => {
      console.log("[v0] Auto-refreshing metrics...")
      try {
        const response = await fetch("/api/v1/system/metrics")
        if (response.ok) {
          const data = await response.json()
          console.log(
            "[v0] Metrics updated for",
            Object.keys(data.services || {}).length,
            "services",
          )
          setServices((prev) =>
            prev.map((service) => {
              const metrics = data.services?.[service.id]
              return metrics ? { ...service, ...metrics } : service
            }),
          )
          setLastUpdate(new Date())
        }
      } catch (error) {
        console.error("[v0] Auto-refresh failed:", error)
      }
    }, 10000) // Reduced from 30 seconds to 10 seconds for real-time feel

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleManualRefresh = async () => {
    console.log("[v0] Manual refresh triggered")
    setIsLoading(true)
    try {
      const [servicesResponse, metricsResponse] = await Promise.all([
        fetch("/api/v1/system/services"),
        fetch("/api/v1/system/metrics"),
      ])

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        if (servicesData.services) {
          setServices(servicesData.services)
        }
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setServices((prev) =>
          prev.map((service) => {
            const metrics = metricsData.services?.[service.id]
            return metrics ? { ...service, ...metrics } : service
          }),
        )
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error("[v0] Manual refresh failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleServiceAction = async (serviceId: string, action: "start" | "stop" | "restart") => {
    console.log(`[v0] Service action: ${action} for ${serviceId}`)

    try {
      const response = await fetch(`/api/v1/system/services/${serviceId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`[v0] Service ${action} successful:`, result)

        setServices((prev) =>
          prev.map((service) =>
            service.id === serviceId
              ? { ...service, status: action === "stop" ? "stopped" : "running" }
              : service,
          ),
        )
      } else {
        console.error(`[v0] Service ${action} failed:`, response.statusText)
      }
    } catch (error) {
      console.error(`[v0] Service ${action} error:`, error)
    }
  }

  const handleConfigUpdate = async (serviceId: string, config: any) => {
    console.log(`[v0] Config update for ${serviceId}:`, config)

    try {
      const response = await fetch(`/api/v1/system/services/${serviceId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`[v0] Config update successful:`, result)
      } else {
        console.error(`[v0] Config update failed:`, response.statusText)
      }
    } catch (error) {
      console.error(`[v0] Config update error:`, error)
    }
  }

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "running":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "maintenance":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "stopped":
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: ServiceStatus["status"]) => {
    const variants = {
      running: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      stopped: "bg-gray-100 text-gray-800",
    }
    return <Badge className={variants[status]}>{status.toUpperCase()}</Badge>
  }

  const getTypeIcon = (type: ServiceStatus["type"]) => {
    switch (type) {
      case "api":
        return <Globe className="h-4 w-4" />
      case "database":
        return <Database className="h-4 w-4" />
      case "queue":
        return <Zap className="h-4 w-4" />
      case "cache":
        return <Activity className="h-4 w-4" />
      case "auth":
        return <Shield className="h-4 w-4" />
      case "storage":
        return <HardDrive className="h-4 w-4" />
    }
  }

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "text-red-600"
      case "warn":
        return "text-yellow-600"
      case "info":
        return "text-blue-600"
      case "debug":
        return "text-gray-600"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backend Services</h2>
          <p className="text-gray-600">
            Monitor and manage all backend services • Last updated:{" "}
            {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label>Auto-refresh (10s)</Label>
          </div>
          <Button onClick={handleManualRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Running Services</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {services.filter((s) => s.status === "running").length}
                </div>
                <p className="text-xs text-gray-600">of {services.length} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Services</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {services.filter((s) => s.status === "error").length}
                </div>
                <p className="text-xs text-gray-600">need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {services.reduce((sum, s) => sum + (s.requests || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-600">last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {services.reduce((sum, s) => sum + (s.errors || 0), 0)}
                </div>
                <p className="text-xs text-gray-600">last 24 hours</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
                <CardDescription>Current status of all backend services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(service.type)}
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-600">v{service.version}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(service.status)}
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Logs</CardTitle>
                <CardDescription>Latest system events and errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start space-x-3 p-2 border-l-2 border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs font-medium uppercase ${getLevelColor(log.level)}`}
                          >
                            {log.level}
                          </span>
                          <span className="text-xs text-gray-500">{log.service}</span>
                        </div>
                        <div className="text-sm mt-1">{log.message}</div>
                        <div className="text-xs text-gray-500 mt-1">{log.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(service.type)}
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                  <CardDescription>
                    v{service.version} • Uptime: {service.uptime}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">CPU Usage</div>
                      <div className="text-lg font-semibold">{service.cpu}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${service.cpu}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Memory</div>
                      <div className="text-lg font-semibold">{service.memory}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${service.memory}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Requests</div>
                      <div className="font-semibold">
                        {(service.requests || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Errors</div>
                      <div className="font-semibold text-red-600">{service.errors || 0}</div>
                    </div>
                  </div>

                  {service.port && (
                    <div className="text-sm">
                      <span className="text-gray-600">Port:</span> {service.port}
                      {service.url && <span className="ml-2 text-gray-600">URL:</span>}
                      {service.url && <span className="ml-1 font-mono">{service.url}</span>}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleServiceAction(service.id, "restart")}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restart
                    </Button>
                    {service.status === "running" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleServiceAction(service.id, "stop")}
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleServiceAction(service.id, "start")}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Real-time logs from all backend services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg font-mono text-sm"
                  >
                    <div className="flex-shrink-0">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)} bg-gray-100`}
                      >
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold">{log.service}</span>
                        <span className="text-gray-500">{log.timestamp}</span>
                      </div>
                      <div>{log.message}</div>
                      {log.details && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average CPU Usage</span>
                      <span>
                        {Math.round(services.reduce((sum, s) => sum + s.cpu, 0) / services.length)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.round(services.reduce((sum, s) => sum + s.cpu, 0) / services.length)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Memory Usage</span>
                      <span>
                        {Math.round(
                          services.reduce((sum, s) => sum + s.memory, 0) / services.length,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.round(services.reduce((sum, s) => sum + s.memory, 0) / services.length)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Statistics</CardTitle>
                <CardDescription>API request metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">
                        {services.reduce((sum, s) => sum + (s.requests || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Requests</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {services.reduce((sum, s) => sum + (s.errors || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Errors</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Error Rate</div>
                    <div className="text-lg font-semibold">
                      {(() => {
                        const totalRequests = services.reduce(
                          (sum, s) => sum + (s.requests || 0),
                          0,
                        )
                        const totalErrors = services.reduce((sum, s) => sum + (s.errors || 0), 0)
                        return totalRequests > 0
                          ? ((totalErrors / totalRequests) * 100).toFixed(2)
                          : "0.00"
                      })()}
                      %
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Configuration</CardTitle>
              <CardDescription>Manage service settings and environment variables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="service-select">Select Service</Label>
                  <select
                    id="service-select"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={selectedService || ""}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="">Choose a service...</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedService && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="config-json">Configuration (JSON)</Label>
                      <Textarea
                        id="config-json"
                        placeholder="Enter service configuration..."
                        className="mt-1 font-mono"
                        rows={10}
                        defaultValue={JSON.stringify(
                          {
                            port: services.find((s) => s.id === selectedService)?.port || 3000,
                            environment: "production",
                            logging: {
                              level: "info",
                              format: "json",
                            },
                            database: {
                              host: "localhost",
                              port: 5432,
                              ssl: true,
                            },
                          },
                          null,
                          2,
                        )}
                      />
                    </div>
                    <Button onClick={() => handleConfigUpdate(selectedService, {})}>
                      <Settings className="h-4 w-4 mr-2" />
                      Update Configuration
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
