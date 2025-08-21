import { type NextRequest, NextResponse } from "next/server"
import { ApiGateway } from "@/lib/api-gateway"
import { createClient } from "@/lib/supabase/server"

const gateway = new ApiGateway({
  requireAuth: true,
  requiredPermissions: ["read"],
  rateLimit: { windowMs: 60000, maxRequests: 100 },
})

export async function GET(request: NextRequest) {
  return gateway.middleware(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get("status")
      const limit = Number.parseInt(searchParams.get("limit") || "10")
      const offset = Number.parseInt(searchParams.get("offset") || "0")

      const supabase = await createClient()

      let query = supabase
        .from("bookings")
        .select(
          `
          *,
          booking_flights(*,
            flight:flights(*,
              airline:airlines(*),
              departure_airport:airports!flights_departure_airport_id_fkey(*),
              arrival_airport:airports!flights_arrival_airport_id_fkey(*)
            )
          ),
          booking_layovers(*,
            layover_package:layover_packages(*)
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq("status", status)
      }

      const { data: bookings, error } = await query

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        data: bookings || [],
        pagination: {
          limit,
          offset,
          hasMore: (bookings?.length || 0) === limit,
        },
      })
    } catch (error) {
      console.error("Bookings fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return gateway.middleware(request, async (req, user) => {
    try {
      const bookingData = await req.json()
      const supabase = await createClient()

      // Validate booking data
      if (
        !bookingData.flights ||
        !Array.isArray(bookingData.flights) ||
        bookingData.flights.length === 0
      ) {
        return NextResponse.json({ error: "At least one flight is required" }, { status: 400 })
      }

      // Start transaction
      const bookingReference = `LHQ${Date.now().toString().slice(-8)}`
      let totalAmount = 0

      // Calculate total amount
      for (const flightBooking of bookingData.flights) {
        const { data: flight } = await supabase
          .from("flights")
          .select("*")
          .eq("id", flightBooking.flight_id)
          .single()

        if (!flight) {
          return NextResponse.json(
            { error: `Flight ${flightBooking.flight_id} not found` },
            { status: 400 },
          )
        }

        const seatClassPrice = flight[`price_${flightBooking.seat_class}`]
        if (!seatClassPrice) {
          return NextResponse.json(
            { error: `Invalid seat class: ${flightBooking.seat_class}` },
            { status: 400 },
          )
        }

        totalAmount += seatClassPrice
      }

      // Add layover packages cost
      if (bookingData.layovers) {
        for (const layoverBooking of bookingData.layovers) {
          const { data: layoverPackage } = await supabase
            .from("layover_packages")
            .select("*")
            .eq("id", layoverBooking.layover_package_id)
            .single()

          if (layoverPackage) {
            totalAmount += layoverPackage.price * (layoverBooking.participants || 1)
          }
        }
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          booking_reference: bookingReference,
          status: "pending",
          total_amount: totalAmount,
          currency: bookingData.currency || "USD",
          payment_status: "pending",
        })
        .select()
        .single()

      if (bookingError) {
        throw bookingError
      }

      // Create flight bookings
      for (const flightBooking of bookingData.flights) {
        const { data: flight } = await supabase
          .from("flights")
          .select("*")
          .eq("id", flightBooking.flight_id)
          .single()

        await supabase.from("booking_flights").insert({
          booking_id: booking.id,
          flight_id: flightBooking.flight_id,
          passenger_name: flightBooking.passenger_name,
          passenger_email: flightBooking.passenger_email,
          seat_class: flightBooking.seat_class,
          price: flight[`price_${flightBooking.seat_class}`],
        })
      }

      // Create layover bookings
      if (bookingData.layovers) {
        for (const layoverBooking of bookingData.layovers) {
          const { data: layoverPackage } = await supabase
            .from("layover_packages")
            .select("*")
            .eq("id", layoverBooking.layover_package_id)
            .single()

          if (layoverPackage) {
            await supabase.from("booking_layovers").insert({
              booking_id: booking.id,
              layover_package_id: layoverBooking.layover_package_id,
              participants: layoverBooking.participants || 1,
              price: layoverPackage.price * (layoverBooking.participants || 1),
            })
          }
        }
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "create",
        resource_type: "booking",
        resource_id: booking.id,
        new_values: { booking_reference: bookingReference, total_amount: totalAmount },
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            ...booking,
            booking_reference: bookingReference,
          },
        },
        { status: 201 },
      )
    } catch (error) {
      console.error("Booking creation error:", error)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }
  })
}
