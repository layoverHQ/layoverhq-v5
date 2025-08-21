import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth, requirePermission } from "@/lib/api-auth"

// Mock integration data
const mockIntegrations = {
  flight: [
    {
      id: "amadeus",
      name: "Amadeus",
      description: "Global flight search and booking API",
      status: "connected",
      lastSync: "2 minutes ago",
      apiKey: "sk_live_amadeus_***",
      endpoint: "https://api.amadeus.com",
      features: ["Flight Search", "Booking", "Real-time Prices"],
    },
    {
      id: "duffel",
      name: "Duffel",
      description: "Modern flight booking infrastructure",
      status: "connected",
      lastSync: "5 minutes ago",
      apiKey: "duffel_live_***",
      endpoint: "https://api.duffel.com",
      features: ["Flight Search", "Booking", "Seat Selection"],
    },
    {
      id: "kiwi",
      name: "Kiwi.com",
      description: "Multi-city and complex routing",
      status: "warning",
      lastSync: "1 hour ago",
      apiKey: "kiwi_api_***",
      endpoint: "https://api.skypicker.com",
      features: ["Multi-city Routes", "Hidden City", "Flexible Dates"],
    },
  ],
  experiences: [
    {
      id: "getyourguide",
      name: "GetYourGuide",
      description: "Tours and activities booking",
      status: "connected",
      lastSync: "10 minutes ago",
      apiKey: "gyg_partner_***",
      endpoint: "https://api.getyourguide.com",
      features: ["City Tours", "Activities", "Skip-the-line"],
    },
    {
      id: "viator",
      name: "Viator",
      description: "TripAdvisor experiences platform",
      status: "disconnected",
      lastSync: "Never",
      apiKey: "",
      endpoint: "https://api.viator.com",
      features: ["Tours", "Experiences", "Local Guides"],
    },
  ],
  payments: [
    {
      id: "stripe",
      name: "Stripe",
      description: "Primary payment processor",
      status: "connected",
      lastSync: "1 minute ago",
      apiKey: "sk_live_stripe_***",
      endpoint: "https://api.stripe.com",
      features: ["Cards", "Digital Wallets", "Refunds"],
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Alternative payment method",
      status: "connected",
      lastSync: "3 minutes ago",
      apiKey: "paypal_client_***",
      endpoint: "https://api.paypal.com",
      features: ["PayPal Checkout", "Express Checkout"],
    },
  ],
  hotels: [
    {
      id: "booking",
      name: "Booking.com",
      description: "Hotel booking for layovers",
      status: "connected",
      lastSync: "15 minutes ago",
      apiKey: "booking_affiliate_***",
      endpoint: "https://distribution-xml.booking.com",
      features: ["Hotel Search", "Availability", "Booking"],
    },
    {
      id: "hotels",
      name: "Hotels.com",
      description: "Alternative hotel provider",
      status: "warning",
      lastSync: "2 hours ago",
      apiKey: "hotels_api_***",
      endpoint: "https://api.ean.com",
      features: ["Hotel Search", "Reviews", "Photos"],
    },
  ],
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request)

  if (authResult instanceof Response) {
    return authResult
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")

  if (category && mockIntegrations[category as keyof typeof mockIntegrations]) {
    return NextResponse.json({
      success: true,
      data: mockIntegrations[category as keyof typeof mockIntegrations],
    })
  }

  return NextResponse.json({
    success: true,
    data: mockIntegrations,
  })
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAdminAuth(request)

  if (authResult instanceof Response) {
    return authResult
  }

  if (!requirePermission(authResult, "write")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  try {
    const { integrationId, category, config } = await request.json()

    // Mock integration update
    const categoryIntegrations = mockIntegrations[category as keyof typeof mockIntegrations]
    if (categoryIntegrations) {
      const integration = categoryIntegrations.find((int: any) => int.id === integrationId)
      if (integration) {
        Object.assign(integration, config)
        integration.lastSync = "Just now"
      }
    }

    return NextResponse.json({
      success: true,
      message: "Integration updated successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid integration data" }, { status: 400 })
  }
}
