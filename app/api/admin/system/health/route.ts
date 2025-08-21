import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth, requirePermission } from "@/lib/api-auth"

// Mock system health data
const mockSystemHealth = {
  services: [
    {
      name: "Flight Service",
      status: "healthy",
      uptime: "99.9%",
      responseTime: 120,
      lastCheck: new Date().toISOString(),
      url: "http://flight-service:3001/health",
    },
    {
      name: "Booking Service",
      status: "healthy",
      uptime: "99.8%",
      responseTime: 95,
      lastCheck: new Date().toISOString(),
      url: "http://booking-service:3002/health",
    },
    {
      name: "AI Service",
      status: "warning",
      uptime: "98.2%",
      responseTime: 250,
      lastCheck: new Date().toISOString(),
      url: "http://ai-service:3003/health",
    },
    {
      name: "Payment Service",
      status: "healthy",
      uptime: "99.9%",
      responseTime: 80,
      lastCheck: new Date().toISOString(),
      url: "http://payment-service:3004/health",
    },
    {
      name: "Notification Service",
      status: "healthy",
      uptime: "99.7%",
      responseTime: 110,
      lastCheck: new Date().toISOString(),
      url: "http://notification-service:3005/health",
    },
  ],
  database: {
    status: "healthy",
    connections: 45,
    maxConnections: 100,
    queryTime: 15,
    lastBackup: "2024-01-15T02:00:00Z",
  },
  redis: {
    status: "healthy",
    memory: "2.1GB",
    maxMemory: "4GB",
    connectedClients: 23,
    operations: 1250,
  },
  agents: {
    orchestrator: { status: "running", tasks: 12, lastActivity: "30s ago" },
    backend: { status: "running", tasks: 3, lastActivity: "2m ago" },
    frontend: { status: "idle", tasks: 0, lastActivity: "15m ago" },
    devops: { status: "running", tasks: 1, lastActivity: "5m ago" },
    qa: { status: "idle", tasks: 0, lastActivity: "1h ago" },
    database: { status: "running", tasks: 2, lastActivity: "1m ago" },
    security: { status: "running", tasks: 1, lastActivity: "10m ago" },
  },
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request)

  if (authResult instanceof Response) {
    return authResult
  }

  if (!requirePermission(authResult, "system-monitor")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  return NextResponse.json({
    success: true,
    data: mockSystemHealth,
    timestamp: new Date().toISOString(),
  })
}
