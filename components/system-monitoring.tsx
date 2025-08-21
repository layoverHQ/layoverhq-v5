"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Server,
  Database,
  MemoryStickIcon as Memory,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Zap,
  Bot,
  TrendingUp,
} from "lucide-react"

// Mock system data - in production, this would come from the API
const mockSystemData = {
  services: [
    {
      name: "Flight Service",
      status: "healthy",
      uptime: "99.9%",
      responseTime: 120,
      lastCheck: new Date().toISOString(),
      url: "http://flight-service:3001/health",
      cpu: 45,
      memory: 68,
      requests: 1250,
    },
    {
      name: "Booking Service",
      status: "healthy",
      uptime: "99.8%",
      responseTime: 95,
      lastCheck: new Date().toISOString(),
      url: "http://booking-service:3002/health",
      cpu: 32,
      memory: 54,
      requests: 890,
    },
    {
      name: "AI Service",
      status: "warning",
      uptime: "98.2%",
      responseTime: 250,
      lastCheck: new Date().toISOString(),
      url: "http://ai-service:3003/health",
      cpu: 78,
      memory: 85,
      requests: 456,
    },
    {
      name: "Payment Service",
      status: "healthy",
      uptime: "99.9%",
      responseTime: 80,
      lastCheck: new Date().toISOString(),
      url: "http://payment-service:3004/health",
      cpu: 28,
      memory: 42,
      requests: 234,
    },
    {
      name: "Notification Service",
      status: "healthy",
      uptime: "99.7%",
      responseTime: 110,
      lastCheck: new Date().toISOString(),
      url: "http://notification-service:3005/health",
      cpu: 15,
      memory: 35,
      requests: 678,
    },
  ],
  database: {
    status: "healthy",
    connections: 45,
    maxConnections: 100,
    queryTime: 15,
    lastBackup: "2024-01-15T02:00:00Z",
    storage: 75,
    queries: 15420,
  },
  redis: {
    status: "healthy",
    memory: 2.1,
    maxMemory: 4,
    connectedClients: 23,
    operations: 1250,
    hitRate: 94.5,
  },
  agents: {
    orchestrator: { status: "running", tasks: 12, lastActivity: "30s ago", cpu: 25, memory: 45 },
    backend: { status: "running", tasks: 3, lastActivity: "2m ago", cpu: 18, memory: 32 },
    frontend: { status: "idle", tasks: 0, lastActivity: "15m ago", cpu: 5, memory: 20 },
    devops: { status: "running", tasks: 1, lastActivity: "5m ago", cpu: 12, memory: 28 },
    qa: { status: "idle", tasks: 0, lastActivity: "1h ago", cpu: 3, memory: 15 },
    database: { status: "running", tasks: 2, lastActivity: "1m ago", cpu: 8, memory: 22 },
    security: { status: "running", tasks: 1, lastActivity: "10m ago", cpu: 15, memory: 30 },
  },
}

export function SystemMonitoring() {
  const [systemData, setSystemData] = useState(mockSystemData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const refreshData = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLastUpdate(new Date())
    setIsRefreshing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "running":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
      case "down":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "idle":
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
      case "running":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Warning
          </Badge>
        )
      case "error":
      case "down":
        return <Badge variant="destructive">Down</Badge>
      case "idle":
        return <Badge variant="outline">Idle</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPerformanceColor = (value: number, threshold = 80) => {
    if (value >= threshold) return "text-red-500"
    if (value >= threshold * 0.7) return "text-yellow-500"
    return "text-green-500"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">System Health Monitoring</h2>
          <p className="text-muted-foreground">Real-time monitoring of all system components</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Services</p>
                <p className="text-2xl font-bold">
                  {systemData.services.filter((s) => s.status === "healthy").length}/
                  {systemData.services.length}
                </p>
              </div>
              <Server className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Badge className="bg-green-100 text-green-800">
                {Math.round(
                  (systemData.services.filter((s) => s.status === "healthy").length /
                    systemData.services.length) *
                    100,
                )}
                % Healthy
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Database</p>
                <p className="text-2xl font-bold">{systemData.database.connections}</p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Progress
                value={(systemData.database.connections / systemData.database.maxConnections) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {systemData.database.connections}/{systemData.database.maxConnections} connections
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Redis Memory</p>
                <p className="text-2xl font-bold">{systemData.redis.memory}GB</p>
              </div>
              <Memory className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Progress
                value={(systemData.redis.memory / systemData.redis.maxMemory) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {systemData.redis.memory}/{systemData.redis.maxMemory}GB used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Agents</p>
                <p className="text-2xl font-bold">
                  {Object.values(systemData.agents).filter((a) => a.status === "running").length}/
                  {Object.values(systemData.agents).length}
                </p>
              </div>
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Badge className="bg-blue-100 text-blue-800">
                {Object.values(systemData.agents).reduce((sum, agent) => sum + agent.tasks, 0)}{" "}
                Active Tasks
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Microservices</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Microservices Health</span>
              </CardTitle>
              <CardDescription>
                Status and performance metrics for all microservices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemData.services.map((service) => (
                  <Card key={service.name} className="border-l-4 border-l-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(service.status)}
                          <h3 className="font-semibold">{service.name}</h3>
                          {getStatusBadge(service.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Uptime: {service.uptime}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Response Time</p>
                          <p
                            className={`text-sm font-medium ${getPerformanceColor(service.responseTime, 200)}`}
                          >
                            {service.responseTime}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CPU Usage</p>
                          <p className={`text-sm font-medium ${getPerformanceColor(service.cpu)}`}>
                            {service.cpu}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Memory Usage</p>
                          <p
                            className={`text-sm font-medium ${getPerformanceColor(service.memory)}`}
                          >
                            {service.memory}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Requests/min</p>
                          <p className="text-sm font-medium">{service.requests}</p>
                        </div>
                      </div>

                      {service.status === "warning" && (
                        <Alert className="mt-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            High resource usage detected. Response time is above normal thresholds.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>PostgreSQL Database</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemData.database.status)}
                    {getStatusBadge(systemData.database.status)}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Connections</span>
                    <span>
                      {systemData.database.connections}/{systemData.database.maxConnections}
                    </span>
                  </div>
                  <Progress
                    value={
                      (systemData.database.connections / systemData.database.maxConnections) * 100
                    }
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Storage Usage</span>
                    <span>{systemData.database.storage}%</span>
                  </div>
                  <Progress value={systemData.database.storage} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Query Time</p>
                    <p className="font-medium">{systemData.database.queryTime}ms avg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Queries/min</p>
                    <p className="font-medium">{systemData.database.queries}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Last Backup</p>
                  <p className="font-medium">
                    {new Date(systemData.database.lastBackup).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Redis Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Redis Cache</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(systemData.redis.status)}
                    {getStatusBadge(systemData.redis.status)}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>
                      {systemData.redis.memory}GB / {systemData.redis.maxMemory}GB
                    </span>
                  </div>
                  <Progress value={(systemData.redis.memory / systemData.redis.maxMemory) * 100} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Connected Clients</p>
                    <p className="font-medium">{systemData.redis.connectedClients}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Operations/sec</p>
                    <p className="font-medium">{systemData.redis.operations}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Cache Hit Rate</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-green-600">{systemData.redis.hitRate}%</p>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>AI Agent System</span>
              </CardTitle>
              <CardDescription>Status and activity of all AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(systemData.agents).map(([name, agent]) => (
                  <Card key={name} className="border-l-4 border-l-accent/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(agent.status)}
                          <h3 className="font-semibold capitalize">{name} Agent</h3>
                        </div>
                        {getStatusBadge(agent.status)}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Active Tasks</span>
                          <span className="font-medium">{agent.tasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Activity</span>
                          <span className="font-medium">{agent.lastActivity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CPU Usage</span>
                          <span className={`font-medium ${getPerformanceColor(agent.cpu)}`}>
                            {agent.cpu}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Memory Usage</span>
                          <span className={`font-medium ${getPerformanceColor(agent.memory)}`}>
                            {agent.memory}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
