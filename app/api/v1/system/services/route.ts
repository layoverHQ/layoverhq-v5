import { NextResponse } from "next/server"

export async function GET() {
  try {
    const mockServices = [
      {
        id: "api-gateway",
        name: "API Gateway",
        type: "api",
        status: "running",
        version: "2.1.4",
        port: 8080,
        url: "https://api.layoverhq.com",
        last_restart: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        id: "auth-service",
        name: "Authentication Service",
        type: "auth",
        status: "running",
        version: "1.8.2",
        port: 3001,
        url: "https://auth.layoverhq.com",
        last_restart: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      },
      {
        id: "postgresql",
        name: "PostgreSQL Database",
        type: "database",
        status: "running",
        version: "15.3",
        port: 5432,
        last_restart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      },
      {
        id: "redis-cache",
        name: "Redis Cache",
        type: "cache",
        status: "running",
        version: "7.0.12",
        port: 6379,
        last_restart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        id: "message-queue",
        name: "Message Queue",
        type: "queue",
        status: "running",
        version: "3.2.1",
        port: 5672,
        last_restart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        id: "file-storage",
        name: "File Storage Service",
        type: "storage",
        status: "running",
        version: "1.4.7",
        port: 9000,
        last_restart: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      },
    ]

    const servicesWithMetrics = mockServices.map((service) => {
      const baseRequests =
        service.type === "api" ? 50000 : service.type === "database" ? 25000 : 10000
      const baseErrors = Math.floor(baseRequests * 0.02) // 2% error rate

      return {
        ...service,
        uptime: calculateUptime(service.last_restart),
        cpu: Math.floor(Math.random() * 30) + 20, // 20-50% CPU usage
        memory: Math.floor(Math.random() * 40) + 30, // 30-70% memory usage
        requests: baseRequests + Math.floor(Math.random() * 10000),
        errors: baseErrors + Math.floor(Math.random() * 100),
      }
    })

    return NextResponse.json({
      services: servicesWithMetrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateUptime(lastRestart: string): string {
  const now = new Date()
  const restart = new Date(lastRestart)
  const diff = now.getTime() - restart.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${days}d ${hours}h ${minutes}m`
}
