import { type NextRequest, NextResponse } from "next/server"
import { ApiGateway } from "@/lib/api-gateway"
import { createClient } from "@/lib/supabase/server"

const gateway = new ApiGateway({
  requireAuth: false, // Public layover packages
  rateLimit: { windowMs: 60000, maxRequests: 100 },
})

export async function GET(request: NextRequest) {
  return gateway.middleware(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url)
      const airportCode = searchParams.get("airport")
      const minDuration = Number.parseInt(searchParams.get("minDuration") || "0")
      const maxDuration = Number.parseInt(searchParams.get("maxDuration") || "24")
      const category = searchParams.get("category")

      const supabase = await createClient()

      let query = supabase
        .from("layover_packages")
        .select(
          `
          *,
          airport:airports(*)
        `,
        )
        .eq("is_active", true)
        .gte("duration_hours", minDuration)
        .lte("duration_hours", maxDuration)

      if (airportCode) {
        const { data: airport } = await supabase
          .from("airports")
          .select("id")
          .eq("code", airportCode)
          .single()

        if (airport) {
          query = query.eq("airport_id", airport.id)
        }
      }

      const { data: packages, error } = await query.order("price", { ascending: true })

      if (error) {
        throw error
      }

      // Filter by category if specified
      let filteredPackages = packages || []
      if (category) {
        filteredPackages = filteredPackages.filter(
          (pkg) =>
            pkg.name.toLowerCase().includes(category.toLowerCase()) ||
            pkg.description.toLowerCase().includes(category.toLowerCase()),
        )
      }

      return NextResponse.json({
        success: true,
        data: filteredPackages,
        filters: {
          airport: airportCode,
          minDuration,
          maxDuration,
          category,
        },
      })
    } catch (error) {
      console.error("Layover packages fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch layover packages" }, { status: 500 })
    }
  })
}
