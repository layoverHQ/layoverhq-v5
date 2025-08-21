import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { eventBus, EventTypes } from "./event-system"

export interface WebhookConfig {
  source: string
  secret?: string
  verifySignature?: (payload: string, signature: string, secret: string) => boolean
}

export class WebhookHandler {
  private configs = new Map<string, WebhookConfig>()

  registerWebhook(endpoint: string, config: WebhookConfig) {
    this.configs.set(endpoint, config)
  }

  async handleWebhook(request: NextRequest, endpoint: string): Promise<NextResponse> {
    try {
      const config = this.configs.get(endpoint)
      if (!config) {
        return NextResponse.json({ error: "Webhook not configured" }, { status: 404 })
      }

      const payload = await request.text()
      const signature =
        request.headers.get("x-signature") || request.headers.get("stripe-signature") || ""

      // Verify webhook signature if configured
      if (config.secret && config.verifySignature) {
        const isValid = config.verifySignature(payload, signature, config.secret)
        if (!isValid) {
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }
      }

      // Parse payload
      const data = JSON.parse(payload)

      // Log webhook receipt
      const supabase = await createClient()
      await supabase.from("webhook_logs").insert({
        source: config.source,
        endpoint,
        payload: data,
        signature,
        received_at: new Date().toISOString(),
        status: "received",
      })

      // Process webhook based on source
      await this.processWebhook(config.source, data, endpoint)

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Webhook processing error:", error)
      return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
    }
  }

  private async processWebhook(source: string, data: any, endpoint: string): Promise<void> {
    switch (source) {
      case "stripe":
        await this.processStripeWebhook(data)
        break

      case "amadeus":
        await this.processAmadeusWebhook(data)
        break

      case "sendgrid":
        await this.processSendGridWebhook(data)
        break

      default:
        console.log(`Unknown webhook source: ${source}`)
    }
  }

  private async processStripeWebhook(data: any): Promise<void> {
    switch (data.type) {
      case "payment_intent.succeeded":
        await eventBus.publish({
          type: EventTypes.PAYMENT_COMPLETED,
          source: "stripe",
          data: {
            payment_id: data.data.object.id,
            amount: data.data.object.amount,
            currency: data.data.object.currency,
            booking_id: data.data.object.metadata.booking_id,
            customer_email: data.data.object.receipt_email,
          },
        })
        break

      case "payment_intent.payment_failed":
        await eventBus.publish({
          type: EventTypes.PAYMENT_FAILED,
          source: "stripe",
          data: {
            payment_id: data.data.object.id,
            booking_id: data.data.object.metadata.booking_id,
            error: data.data.object.last_payment_error?.message,
          },
        })
        break

      case "charge.dispute.created":
        await eventBus.publish({
          type: "payment.dispute.created",
          source: "stripe",
          data: {
            dispute_id: data.data.object.id,
            charge_id: data.data.object.charge,
            amount: data.data.object.amount,
            reason: data.data.object.reason,
          },
        })
        break
    }
  }

  private async processAmadeusWebhook(data: any): Promise<void> {
    switch (data.type) {
      case "flight.delay":
        await eventBus.publish({
          type: EventTypes.FLIGHT_DELAYED,
          source: "amadeus",
          data: {
            flight_id: data.flight.id,
            flight_number: data.flight.number,
            new_departure: data.flight.departure.scheduledTime,
            delay_minutes: data.flight.delay.duration,
            reason: data.flight.delay.reason,
          },
        })
        break

      case "flight.cancellation":
        await eventBus.publish({
          type: EventTypes.FLIGHT_CANCELLED,
          source: "amadeus",
          data: {
            flight_id: data.flight.id,
            flight_number: data.flight.number,
            reason: data.cancellation.reason,
          },
        })
        break

      case "gate.change":
        await eventBus.publish({
          type: EventTypes.FLIGHT_GATE_CHANGED,
          source: "amadeus",
          data: {
            flight_id: data.flight.id,
            flight_number: data.flight.number,
            old_gate: data.gate.previous,
            new_gate: data.gate.current,
          },
        })
        break
    }
  }

  private async processSendGridWebhook(data: any): Promise<void> {
    for (const event of data) {
      switch (event.event) {
        case "delivered":
          await eventBus.publish({
            type: "notification.email.delivered",
            source: "sendgrid",
            data: {
              email: event.email,
              message_id: event.sg_message_id,
              timestamp: event.timestamp,
            },
          })
          break

        case "bounce":
        case "dropped":
          await eventBus.publish({
            type: "notification.email.failed",
            source: "sendgrid",
            data: {
              email: event.email,
              message_id: event.sg_message_id,
              reason: event.reason,
              timestamp: event.timestamp,
            },
          })
          break

        case "open":
          await eventBus.publish({
            type: "notification.email.opened",
            source: "sendgrid",
            data: {
              email: event.email,
              message_id: event.sg_message_id,
              timestamp: event.timestamp,
            },
          })
          break
      }
    }
  }
}

// Global webhook handler instance
export const webhookHandler = new WebhookHandler()

// Register webhook configurations
webhookHandler.registerWebhook("stripe", {
  source: "stripe",
  secret: process.env.STRIPE_WEBHOOK_SECRET,
  verifySignature: (payload, signature, secret) => {
    // Stripe signature verification logic
    return true // Simplified for demo
  },
})

webhookHandler.registerWebhook("amadeus", {
  source: "amadeus",
  secret: process.env.AMADEUS_WEBHOOK_SECRET,
})

webhookHandler.registerWebhook("sendgrid", {
  source: "sendgrid",
  secret: process.env.SENDGRID_WEBHOOK_SECRET,
})
