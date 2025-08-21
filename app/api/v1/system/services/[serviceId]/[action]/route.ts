import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { serviceId: string; action: string } },
) {
  try {
    const { serviceId, action } = params

    if (!["start", "stop", "restart"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    await supabase.from("audit_logs").insert({
      action: `service_${action}`,
      resource_type: "service",
      resource_id: serviceId,
      details: { action, serviceId },
      created_at: new Date().toISOString(),
    })

    const { error: updateError } = await supabase
      .from("system_services")
      .update({
        status: action === "stop" ? "stopped" : "running",
        last_restart: action === "restart" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", serviceId)

    if (updateError) {
      console.error("[v0] Failed to update service status:", updateError)
      return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
    }

    // This would integrate with your container orchestration system (Docker, Kubernetes, etc.)
    console.log(`[v0] Service ${action} executed for ${serviceId}`)

    return NextResponse.json({
      success: true,
      message: `Service ${serviceId} ${action} completed`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Service action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
