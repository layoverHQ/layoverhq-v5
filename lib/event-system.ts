import { createClient } from "@/lib/supabase/server"
import { createClient as createBrowserClient } from "@/lib/supabase/client"

export interface Event {
  id?: string
  type: string
  source: string
  data: Record<string, any>
  metadata?: Record<string, any>
  timestamp?: string
  version?: string
  correlation_id?: string
  user_id?: string
}

export interface EventHandler {
  eventType: string
  handler: (event: Event) => Promise<void>
  retryCount?: number
  deadLetterQueue?: boolean
}

export class EventBus {
  private handlers = new Map<string, EventHandler[]>()
  private supabase: any

  constructor(isServer = true) {
    this.supabase = isServer ? null : createBrowserClient()
  }

  // Register event handler
  subscribe(
    eventType: string,
    handler: (event: Event) => Promise<void>,
    options: Partial<EventHandler> = {},
  ) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }

    this.handlers.get(eventType)!.push({
      eventType,
      handler,
      retryCount: options.retryCount || 3,
      deadLetterQueue: options.deadLetterQueue || true,
    })
  }

  // Publish event
  async publish(event: Event): Promise<void> {
    try {
      const supabase = this.supabase || (await createClient())

      const eventRecord = {
        type: event.type,
        source: event.source,
        data: event.data,
        metadata: event.metadata || {},
        timestamp: event.timestamp || new Date().toISOString(),
        version: event.version || "1.0",
        correlation_id: event.correlation_id || this.generateCorrelationId(),
        user_id: event.user_id,
        status: "pending",
        retry_count: 0,
      }

      // Store event in database
      const { data: storedEvent, error } = await supabase
        .from("events")
        .insert(eventRecord)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Process event immediately if handlers are registered
      await this.processEvent({ ...storedEvent, id: storedEvent.id })

      // Also add to processing queue for background processing
      await this.enqueueEvent(storedEvent)
    } catch (error) {
      console.error("Failed to publish event:", error)
      throw error
    }
  }

  // Process event with registered handlers
  private async processEvent(event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || []

    for (const handlerConfig of handlers) {
      try {
        await handlerConfig.handler(event)
      } catch (error) {
        console.error(`Handler failed for event ${event.type}:`, error)

        // Handle retry logic
        await this.handleFailedEvent(event, handlerConfig, error as Error)
      }
    }
  }

  // Add event to processing queue
  private async enqueueEvent(event: any): Promise<void> {
    try {
      const supabase = this.supabase || (await createClient())

      await supabase.from("event_queue").insert({
        event_id: event.id,
        event_type: event.type,
        priority: this.getEventPriority(event.type),
        scheduled_at: new Date().toISOString(),
        status: "queued",
        retry_count: 0,
      })
    } catch (error) {
      console.error("Failed to enqueue event:", error)
    }
  }

  // Handle failed event processing
  private async handleFailedEvent(
    event: Event,
    handlerConfig: EventHandler,
    error: Error,
  ): Promise<void> {
    try {
      const supabase = this.supabase || (await createClient())

      const retryCount = (event.metadata?.retry_count || 0) + 1

      if (retryCount <= (handlerConfig.retryCount || 3)) {
        // Schedule retry
        await supabase.from("event_queue").insert({
          event_id: event.id,
          event_type: event.type,
          priority: "high",
          scheduled_at: new Date(Date.now() + Math.pow(2, retryCount) * 1000).toISOString(), // Exponential backoff
          status: "retry",
          retry_count: retryCount,
          error_message: error.message,
        })
      } else if (handlerConfig.deadLetterQueue) {
        // Send to dead letter queue
        await supabase.from("dead_letter_queue").insert({
          event_id: event.id,
          event_type: event.type,
          event_data: event.data,
          error_message: error.message,
          failed_at: new Date().toISOString(),
          retry_count: retryCount,
        })
      }
    } catch (retryError) {
      console.error("Failed to handle event retry:", retryError)
    }
  }

  private getEventPriority(eventType: string): string {
    const highPriority = ["payment.failed", "booking.cancelled", "system.alert"]
    const lowPriority = ["analytics.track", "log.info"]

    if (highPriority.includes(eventType)) return "high"
    if (lowPriority.includes(eventType)) return "low"
    return "normal"
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Listen for real-time events (client-side)
  subscribeToRealtime(eventTypes: string[], callback: (event: Event) => void) {
    if (!this.supabase) {
      console.error("Real-time subscription only available on client-side")
      return
    }

    return this.supabase
      .channel("events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
          filter: `type=in.(${eventTypes.join(",")})`,
        },
        (payload: any) => {
          callback(payload.new as Event)
        },
      )
      .subscribe()
  }
}

// Global event bus instance
export const eventBus = new EventBus()

// Event type constants
export const EventTypes = {
  // Booking events
  BOOKING_CREATED: "booking.created",
  BOOKING_CONFIRMED: "booking.confirmed",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_COMPLETED: "booking.completed",

  // Payment events
  PAYMENT_INITIATED: "payment.initiated",
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",

  // Flight events
  FLIGHT_DELAYED: "flight.delayed",
  FLIGHT_CANCELLED: "flight.cancelled",
  FLIGHT_GATE_CHANGED: "flight.gate_changed",

  // User events
  USER_REGISTERED: "user.registered",
  USER_LOGIN: "user.login",
  USER_PROFILE_UPDATED: "user.profile_updated",

  // System events
  SYSTEM_ALERT: "system.alert",
  INTEGRATION_FAILED: "integration.failed",
  AI_TASK_COMPLETED: "ai.task_completed",

  // Notification events
  EMAIL_SEND: "notification.email.send",
  SMS_SEND: "notification.sms.send",
  PUSH_SEND: "notification.push.send",
} as const

// Register default event handlers
eventBus.subscribe(EventTypes.BOOKING_CREATED, async (event) => {
  console.log("Processing booking created event:", event.data.booking_id)

  // Send confirmation email
  await eventBus.publish({
    type: EventTypes.EMAIL_SEND,
    source: "booking-service",
    data: {
      to: event.data.customer_email,
      template: "booking_confirmation",
      data: event.data,
    },
    correlation_id: event.correlation_id,
    user_id: event.user_id,
  })

  // Update analytics
  await eventBus.publish({
    type: "analytics.track",
    source: "booking-service",
    data: {
      event: "booking_created",
      properties: {
        booking_id: event.data.booking_id,
        amount: event.data.total_amount,
        currency: event.data.currency,
      },
    },
    correlation_id: event.correlation_id,
    user_id: event.user_id,
  })
})

eventBus.subscribe(EventTypes.PAYMENT_COMPLETED, async (event) => {
  console.log("Processing payment completed event:", event.data.payment_id)

  // Update booking status
  const supabase = await createClient()
  await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      status: "confirmed",
    })
    .eq("id", event.data.booking_id)

  // Send payment confirmation
  await eventBus.publish({
    type: EventTypes.EMAIL_SEND,
    source: "payment-service",
    data: {
      to: event.data.customer_email,
      template: "payment_confirmation",
      data: event.data,
    },
    correlation_id: event.correlation_id,
    user_id: event.user_id,
  })
})

eventBus.subscribe(EventTypes.FLIGHT_DELAYED, async (event) => {
  console.log("Processing flight delayed event:", event.data.flight_id)

  // Notify affected passengers
  const supabase = await createClient()
  const { data: bookings } = await supabase
    .from("booking_flights")
    .select(
      `
      booking:bookings(user_id, booking_reference),
      passenger_email
    `,
    )
    .eq("flight_id", event.data.flight_id)

  for (const booking of bookings || []) {
    if (booking.booking && Array.isArray(booking.booking) && booking.booking.length > 0) {
      await eventBus.publish({
        type: EventTypes.EMAIL_SEND,
        source: "flight-service",
        data: {
          to: booking.passenger_email,
          template: "flight_delay_notification",
          data: {
            ...event.data,
            booking_reference: booking.booking[0].booking_reference,
          },
        },
        correlation_id: event.correlation_id,
        user_id: booking.booking[0].user_id,
      })
    }
  }
})
