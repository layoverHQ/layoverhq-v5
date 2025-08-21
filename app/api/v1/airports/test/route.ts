import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("[v0] Airport test endpoint called")

  try {
    const supabase = await createClient()

    // Test database connection and count airports
    const { data: countData, error: countError } = await supabase
      .from("airports")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.log("[v0] Airport count error:", countError)
      return NextResponse.json(
        {
          error: "Database error",
          details: countError.message,
        },
        { status: 500 },
      )
    }

    // Get sample airports
    const { data: sampleData, error: sampleError } = await supabase
      .from("airports")
      .select("code, name, city, country, is_hub")
      .limit(10)

    if (sampleError) {
      console.log("[v0] Sample airports error:", sampleError)
      return NextResponse.json(
        {
          error: "Sample query error",
          details: sampleError.message,
        },
        { status: 500 },
      )
    }

    // Test search functionality
    const { data: searchData, error: searchError } = await supabase
      .from("airports")
      .select("code, name, city, country, is_hub")
      .or("name.ilike.%london%,city.ilike.%london%,code.ilike.%lhr%")
      .limit(5)

    console.log("[v0] Airport test results:", {
      totalCount: countData?.length || 0,
      sampleCount: sampleData?.length || 0,
      searchCount: searchData?.length || 0,
    })

    return NextResponse.json({
      success: true,
      totalAirports: countData?.length || 0,
      sampleAirports: sampleData || [],
      searchTest: searchData || [],
      message: "Airport database test completed successfully",
    })
  } catch (error) {
    console.error("[v0] Airport test error:", error)
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
