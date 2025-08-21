import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/api-auth"

// Mock dashboard statistics
const mockStats = {
  totalBookings: { value: 1247, change: 12.5, trend: "up" },
  activeUsers: { value: 8934, change: -2.1, trend: "down" },
  revenue: { value: 284750, change: 18.2, trend: "up" },
  flightRoutes: { value: 156, change: 5.3, trend: "up" },
  systemHealth: [
    { service: "Flight Service", status: "healthy", uptime: "99.9%" },
    { service: "Booking Service", status: "healthy", uptime: "99.8%" },
    { service: "AI Service", status: "warning", uptime: "98.2%" },
    { service: "Payment Service", status: "healthy", uptime: "99.9%" },
  ],
  recentActivity: [
    { id: 1, type: "booking", message: "New booking: NYC → Dubai → Singapore", time: "2 min ago" },
    {
      id: 2,
      type: "user",
      message: "New user registration: john.doe@email.com",
      time: "5 min ago",
    },
    { id: 3, type: "system", message: "AI Agent completed route optimization", time: "12 min ago" },
    { id: 4, type: "alert", message: "High traffic detected on Dubai routes", time: "18 min ago" },
  ],
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request)

  if (authResult instanceof Response) {
    return authResult
  }

  return NextResponse.json({
    success: true,
    data: mockStats,
  })
}
