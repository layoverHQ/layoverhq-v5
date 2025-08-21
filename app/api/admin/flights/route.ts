import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth, requirePermission } from "@/lib/api-auth"

// Mock flight data
const mockFlights = [
  {
    id: "FL001",
    airline: "Qatar Airways",
    route: "NYC → DOH → SIN",
    departure: "2024-01-15 14:30",
    arrival: "2024-01-16 22:45",
    layoverDuration: "8h 30m",
    layoverCity: "Doha",
    price: 1250,
    status: "active",
    bookings: 45,
  },
  {
    id: "FL002",
    airline: "Emirates",
    route: "LAX → DXB → BKK",
    departure: "2024-01-15 23:15",
    arrival: "2024-01-17 18:20",
    layoverDuration: "12h 15m",
    layoverCity: "Dubai",
    price: 1180,
    status: "active",
    bookings: 32,
  },
  {
    id: "FL003",
    airline: "Turkish Airlines",
    route: "JFK → IST → DEL",
    departure: "2024-01-16 08:45",
    arrival: "2024-01-17 14:30",
    layoverDuration: "6h 45m",
    layoverCity: "Istanbul",
    price: 980,
    status: "delayed",
    bookings: 28,
  },
  {
    id: "FL004",
    airline: "Singapore Airlines",
    route: "SFO → SIN → SYD",
    departure: "2024-01-16 16:20",
    arrival: "2024-01-18 09:15",
    layoverDuration: "10h 30m",
    layoverCity: "Singapore",
    price: 1420,
    status: "active",
    bookings: 51,
  },
]

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request)

  if (authResult instanceof Response) {
    return authResult
  }

  if (!requirePermission(authResult, "manage-flights")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const status = searchParams.get("status")

  let filteredFlights = mockFlights

  if (search) {
    filteredFlights = filteredFlights.filter(
      (flight) =>
        flight.route.toLowerCase().includes(search.toLowerCase()) ||
        flight.airline.toLowerCase().includes(search.toLowerCase()) ||
        flight.id.toLowerCase().includes(search.toLowerCase()),
    )
  }

  if (status && status !== "all") {
    filteredFlights = filteredFlights.filter((flight) => flight.status === status)
  }

  return NextResponse.json({
    success: true,
    data: filteredFlights,
    total: filteredFlights.length,
  })
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth(request)

  if (authResult instanceof Response) {
    return authResult
  }

  if (!requirePermission(authResult, "manage-flights")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const flightData = await request.json()

    // Mock flight creation
    const newFlight = {
      id: `FL${String(mockFlights.length + 1).padStart(3, "0")}`,
      ...flightData,
      bookings: 0,
      status: "active",
    }

    mockFlights.push(newFlight)

    return NextResponse.json(
      {
        success: true,
        data: newFlight,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ error: "Invalid flight data" }, { status: 400 })
  }
}
