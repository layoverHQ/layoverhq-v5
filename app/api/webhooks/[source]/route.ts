import type { NextRequest } from "next/server"
import { webhookHandler } from "@/lib/webhook-handler"

export async function POST(request: NextRequest, { params }: { params: { source: string } }) {
  const source = params.source
  return webhookHandler.handleWebhook(request, source)
}
