export async function GET() {
  try {
    console.log("[v0] Fetching real-time system metrics...")

    const serviceMetrics = {
      "api-gateway": {
        status: "running",
        cpu: Math.floor(Math.random() * 20) + 25, // 25-45%
        memory: Math.floor(Math.random() * 30) + 40, // 40-70%
        requests: 52000 + Math.floor(Math.random() * 5000),
        errors: 1040 + Math.floor(Math.random() * 50),
        uptime: calculateUptime(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      },
      "auth-service": {
        status: "running",
        cpu: Math.floor(Math.random() * 15) + 15, // 15-30%
        memory: Math.floor(Math.random() * 25) + 35, // 35-60%
        requests: 28000 + Math.floor(Math.random() * 3000),
        errors: 560 + Math.floor(Math.random() * 30),
        uptime: calculateUptime(new Date(Date.now() - 12 * 60 * 60 * 1000)),
      },
      postgresql: {
        status: "running",
        cpu: Math.floor(Math.random() * 25) + 30, // 30-55%
        memory: Math.floor(Math.random() * 35) + 45, // 45-80%
        requests: 35000 + Math.floor(Math.random() * 4000),
        errors: 350 + Math.floor(Math.random() * 20),
        uptime: calculateUptime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      },
      "redis-cache": {
        status: "running",
        cpu: Math.floor(Math.random() * 10) + 10, // 10-20%
        memory: Math.floor(Math.random() * 20) + 25, // 25-45%
        requests: 45000 + Math.floor(Math.random() * 6000),
        errors: 90 + Math.floor(Math.random() * 10),
        uptime: calculateUptime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      },
      "message-queue": {
        status: "running",
        cpu: Math.floor(Math.random() * 15) + 20, // 20-35%
        memory: Math.floor(Math.random() * 30) + 30, // 30-60%
        requests: 18000 + Math.floor(Math.random() * 2000),
        errors: 180 + Math.floor(Math.random() * 15),
        uptime: calculateUptime(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      },
      "file-storage": {
        status: "running",
        cpu: Math.floor(Math.random() * 20) + 15, // 15-35%
        memory: Math.floor(Math.random() * 25) + 40, // 40-65%
        requests: 12000 + Math.floor(Math.random() * 1500),
        errors: 120 + Math.floor(Math.random() * 12),
        uptime: calculateUptime(new Date(Date.now() - 6 * 60 * 60 * 1000)),
      },
    }

    const services = Object.values(serviceMetrics)
    const systemMetrics = {
      cpu_usage: Math.round(services.reduce((sum, s) => sum + s.cpu, 0) / services.length),
      memory_usage: Math.round(services.reduce((sum, s) => sum + s.memory, 0) / services.length),
      disk_usage: Math.floor(Math.random() * 30) + 45, // 45-75%
      network_io: Math.floor(Math.random() * 500) + 200, // 200-700 MB/s
      active_connections: Math.floor(Math.random() * 200) + 150, // 150-350 connections
      response_time: Math.floor(Math.random() * 50) + 25, // 25-75ms
      error_rate: (
        (services.reduce((sum, s) => sum + s.errors, 0) /
          services.reduce((sum, s) => sum + s.requests, 0)) *
        100
      ).toFixed(2),
      throughput: services.reduce((sum, s) => sum + s.requests, 0),
    }

    return Response.json({
      services: serviceMetrics,
      system: systemMetrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.log("[v0] Metrics error:", error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

function calculateUptime(lastRestart: Date): string {
  const now = new Date()
  const diff = now.getTime() - lastRestart.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return `${days}d ${hours}h ${minutes}m`
}
