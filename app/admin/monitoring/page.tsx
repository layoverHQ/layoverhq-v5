"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Server,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  Info,
} from "lucide-react"

interface SystemMetrics {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  network: {
    in: number
    out: number
  }
  database: {
    connections: number
    queries: number
    avgResponseTime: number
  }
  api: {
    requests: number
    errors: number
    avgLatency: number
  }
}

interface Alert {
  id: string
  severity: "critical" | "warning" | "info"
  title: string
  description: string
  timestamp: string
  resolved: boolean
}

export default function MonitoringPage() {
  const [timeRange, setTimeRange] = useState("1h")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [metrics, setMetrics] = useState<SystemMetrics[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadMetrics()
    const interval = autoRefresh ? setInterval(loadMetrics, 30000) : null
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeRange, autoRefresh])

  const loadMetrics = async () => {
    try {
      // Mock data for demonstration
      const mockData = generateMockMetrics(timeRange)
      setMetrics(mockData)
      setAlerts(mockAlerts)
      setLoading(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive",
      })
    }
  }

  const currentMetrics = metrics[metrics.length - 1] || {
    cpu: 0,
    memory: 0,
    disk: 0,
    network: { in: 0, out: 0 },
    database: { connections: 0, queries: 0, avgResponseTime: 0 },
    api: { requests: 0, errors: 0, avgLatency: 0 },
  }

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return "destructive"
    if (value >= thresholds.warning) return "warning"
    return "success"
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time performance metrics and system health</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto Refresh: ON" : "Auto Refresh: OFF"}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.cpu}%</div>
            <Progress value={currentMetrics.cpu} className="mt-2" />
            <Badge
              variant={getStatusColor(currentMetrics.cpu, { warning: 70, critical: 90 }) as any}
              className="mt-2"
            >
              {currentMetrics.cpu < 70
                ? "Healthy"
                : currentMetrics.cpu < 90
                  ? "Warning"
                  : "Critical"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.memory}%</div>
            <Progress value={currentMetrics.memory} className="mt-2" />
            <Badge
              variant={getStatusColor(currentMetrics.memory, { warning: 75, critical: 90 }) as any}
              className="mt-2"
            >
              {currentMetrics.memory < 75
                ? "Healthy"
                : currentMetrics.memory < 90
                  ? "Warning"
                  : "Critical"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Latency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.api.avgLatency}ms</div>
            <Progress
              value={Math.min((currentMetrics.api.avgLatency / 200) * 100, 100)}
              className="mt-2"
            />
            <Badge
              variant={
                getStatusColor(currentMetrics.api.avgLatency, {
                  warning: 100,
                  critical: 200,
                }) as any
              }
              className="mt-2"
            >
              {currentMetrics.api.avgLatency < 100
                ? "Fast"
                : currentMetrics.api.avgLatency < 200
                  ? "Slow"
                  : "Critical"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMetrics.api.requests > 0
                ? ((currentMetrics.api.errors / currentMetrics.api.requests) * 100).toFixed(2)
                : 0}
              %
            </div>
            <Progress
              value={
                currentMetrics.api.requests > 0
                  ? (currentMetrics.api.errors / currentMetrics.api.requests) * 100
                  : 0
              }
              className="mt-2"
            />
            <Badge
              variant={
                currentMetrics.api.requests > 0
                  ? (getStatusColor(
                      (currentMetrics.api.errors / currentMetrics.api.requests) * 100,
                      { warning: 1, critical: 5 },
                    ) as any)
                  : ("success" as any)
              }
              className="mt-2"
            >
              {currentMetrics.api.requests === 0
                ? "No Data"
                : (currentMetrics.api.errors / currentMetrics.api.requests) * 100 < 1
                  ? "Normal"
                  : (currentMetrics.api.errors / currentMetrics.api.requests) * 100 < 5
                    ? "Elevated"
                    : "Critical"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>System alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts
                .filter((a) => !a.resolved)
                .map((alert) => (
                  <Alert
                    key={alert.id}
                    variant={alert.severity === "critical" ? "destructive" : "default"}
                  >
                    {getAlertIcon(alert.severity)}
                    <AlertTitle className="ml-2">{alert.title}</AlertTitle>
                    <AlertDescription className="ml-6">
                      {alert.description}
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
              <CardDescription>CPU, Memory, and Disk usage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
                  <Line type="monotone" dataKey="disk" stroke="#ffc658" name="Disk %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Connections</CardTitle>
                <CardDescription>Active connection pool usage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                    <Area
                      type="monotone"
                      dataKey="database.connections"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Connections"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Average query response time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                    <Line
                      type="monotone"
                      dataKey="database.avgResponseTime"
                      stroke="#82ca9d"
                      name="Avg Response (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>API Request Volume</CardTitle>
                <CardDescription>Requests per minute</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                    <Bar dataKey="api.requests" fill="#8884d8" name="Requests" />
                    <Bar dataKey="api.errors" fill="#ff6b6b" name="Errors" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>API Latency Distribution</CardTitle>
                <CardDescription>Response time breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "<50ms", value: 45, fill: "#00C49F" },
                        { name: "50-100ms", value: 30, fill: "#FFBB28" },
                        { name: "100-200ms", value: 20, fill: "#FF8042" },
                        { name: ">200ms", value: 5, fill: "#FF4444" },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[].map((entry, index) => (
                        <Cell key={`cell-${index}`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Traffic</CardTitle>
              <CardDescription>Inbound and outbound traffic (MB/s)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="network.in"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Inbound"
                  />
                  <Area
                    type="monotone"
                    dataKey="network.out"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Outbound"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to generate mock metrics
function generateMockMetrics(timeRange: string): SystemMetrics[] {
  const now = Date.now()
  const intervals = {
    "1h": 60,
    "6h": 360,
    "24h": 1440,
    "7d": 10080,
  }
  const points = timeRange === "1h" ? 60 : timeRange === "6h" ? 72 : timeRange === "24h" ? 96 : 168
  const interval = (intervals[timeRange as keyof typeof intervals] * 60 * 1000) / points

  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(now - (points - i) * interval).toISOString(),
    cpu: 30 + Math.random() * 40 + Math.sin(i / 10) * 10,
    memory: 50 + Math.random() * 30 + Math.cos(i / 8) * 5,
    disk: 60 + Math.random() * 20,
    network: {
      in: 10 + Math.random() * 50,
      out: 5 + Math.random() * 30,
    },
    database: {
      connections: Math.floor(20 + Math.random() * 30),
      queries: Math.floor(100 + Math.random() * 200),
      avgResponseTime: 20 + Math.random() * 30,
    },
    api: {
      requests: Math.floor(500 + Math.random() * 500),
      errors: Math.floor(Math.random() * 10),
      avgLatency: 50 + Math.random() * 100,
    },
  }))
}

// Mock alerts
const mockAlerts: Alert[] = [
  {
    id: "1",
    severity: "warning",
    title: "High Memory Usage",
    description: "Memory usage has exceeded 75% threshold",
    timestamp: new Date().toISOString(),
    resolved: false,
  },
  {
    id: "2",
    severity: "info",
    title: "Scheduled Maintenance",
    description: "Database maintenance window scheduled for 2 AM UTC",
    timestamp: new Date().toISOString(),
    resolved: false,
  },
]
