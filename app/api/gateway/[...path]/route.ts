/**
 * Enterprise API Gateway - Multi-Tenant Request Router
 *
 * Central gateway that handles all enterprise API requests with
 * tenant isolation, rate limiting, authentication, and analytics.
 */

import { NextRequest, NextResponse } from "next/server"
import { getApiGateway } from "@/lib/services/multi-tenant-api-gateway"

/**
 * Handle all HTTP methods through the API gateway
 */
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params)
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params)
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params)
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params)
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params)
}

/**
 * Main gateway request handler
 */
async function handleGatewayRequest(request: NextRequest, params: { path: string[] }) {
  try {
    // Skip gateway processing for internal requests
    if (request.headers.get("X-Internal-Request") === "true") {
      return NextResponse.next()
    }

    // Reconstruct the original path
    const originalPath = "/" + params.path.join("/")
    const url = new URL(request.url)
    url.pathname = originalPath

    // Create a new request with the corrected path
    const correctedRequest = new NextRequest(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })

    // Process through the API gateway
    const gateway = getApiGateway()
    const response = await gateway.handleRequest(correctedRequest)

    return response
  } catch (error) {
    console.error("[API Gateway] Error processing request:", error)

    return NextResponse.json(
      {
        error: {
          code: 500,
          message: "API Gateway error",
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 500,
        headers: {
          "X-Gateway-Error": "true",
          "X-Gateway-Version": "2.0",
        },
      },
    )
  }
}
