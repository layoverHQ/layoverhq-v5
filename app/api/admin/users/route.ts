import { NextResponse } from "next/server"

const OFFLINE_MODE = true

const generateMockUsers = () => [
  {
    id: "mock-admin-id",
    email: "admin@layoverhq.com",
    first_name: "LayoverHQ",
    last_name: "Admin",
    display_name: "LayoverHQ Admin",
    role: "admin",
    department: "System",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-user-1",
    email: "john.doe@layoverhq.com",
    first_name: "John",
    last_name: "Doe",
    display_name: "John Doe",
    role: "user",
    department: "Operations",
    is_active: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "mock-user-2",
    email: "jane.smith@layoverhq.com",
    first_name: "Jane",
    last_name: "Smith",
    display_name: "Jane Smith",
    role: "manager",
    department: "Customer Service",
    is_active: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "mock-user-3",
    email: "mike.wilson@layoverhq.com",
    first_name: "Mike",
    last_name: "Wilson",
    display_name: "Mike Wilson",
    role: "user",
    department: "Support",
    is_active: false,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "mock-user-4",
    email: "sarah.johnson@layoverhq.com",
    first_name: "Sarah",
    last_name: "Johnson",
    display_name: "Sarah Johnson",
    role: "manager",
    department: "Sales",
    is_active: true,
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
]

export async function GET(request) {
  try {
    console.log("[v0] Users API: Starting request in offline mode")

    if (OFFLINE_MODE) {
      console.log("[v0] Users API: Running in offline mode - returning mock data")

      const { searchParams } = new URL(request.url)
      const search = searchParams.get("search")
      const status = searchParams.get("status")
      const role = searchParams.get("role")

      let mockUsers = generateMockUsers()

      // Apply filters to mock data
      if (search) {
        const searchLower = search.toLowerCase()
        mockUsers = mockUsers.filter(
          (user) =>
            user.email.toLowerCase().includes(searchLower) ||
            user.first_name.toLowerCase().includes(searchLower) ||
            user.last_name.toLowerCase().includes(searchLower) ||
            user.display_name.toLowerCase().includes(searchLower),
        )
      }

      if (status && status !== "all") {
        const isActive = status === "active"
        mockUsers = mockUsers.filter((user) => user.is_active === isActive)
      }

      if (role && role !== "all") {
        mockUsers = mockUsers.filter((user) => user.role === role)
      }

      return NextResponse.json({
        success: true,
        users: mockUsers,
        total: mockUsers.length,
        offline: true,
      })
    }

    // Fallback if offline mode is disabled
    return NextResponse.json({
      success: true,
      users: generateMockUsers(),
      total: 5,
      offline: true,
    })
  } catch (error) {
    console.error("[v0] Users API: Error occurred, returning mock data:", error)

    return NextResponse.json({
      success: true,
      users: generateMockUsers(),
      total: 5,
      error: "Service temporarily unavailable",
      offline: true,
    })
  }
}

export async function POST(request) {
  try {
    console.log("[v0] Users API: POST request - returning mock success")

    return NextResponse.json({
      success: true,
      message: "User creation simulated in offline mode",
      offline: true,
    })
  } catch (error) {
    console.error("[v0] Users API: POST error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Service temporarily unavailable",
        offline: true,
      },
      { status: 500 },
    )
  }
}
