import { createClient } from "@/lib/supabase/server"
import { EventTypes, eventBus } from "./event-system"

export interface Job {
  id?: string
  type: string
  data: Record<string, any>
  priority: "low" | "normal" | "high" | "critical"
  scheduled_at?: string
  max_retries?: number
  timeout?: number
}

export class JobProcessor {
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  constructor(private intervalMs = 5000) {}

  // Start processing jobs
  start() {
    if (this.isProcessing) return

    this.isProcessing = true
    this.processingInterval = setInterval(() => {
      this.processJobs().catch(console.error)
    }, this.intervalMs)

    console.log("Job processor started")
  }

  // Stop processing jobs
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    this.isProcessing = false
    console.log("Job processor stopped")
  }

  // Add job to queue
  async enqueue(job: Job): Promise<void> {
    try {
      const supabase = await createClient()

      await supabase.from("job_queue").insert({
        type: job.type,
        data: job.data,
        priority: job.priority,
        scheduled_at: job.scheduled_at || new Date().toISOString(),
        max_retries: job.max_retries || 3,
        timeout: job.timeout || 30000,
        status: "queued",
        retry_count: 0,
      })
    } catch (error) {
      console.error("Failed to enqueue job:", error)
      throw error
    }
  }

  // Process pending jobs
  private async processJobs(): Promise<void> {
    try {
      const supabase = await createClient()

      // Get pending jobs ordered by priority and scheduled time
      const { data: jobs, error } = await supabase
        .from("job_queue")
        .select("*")
        .in("status", ["queued", "retry"])
        .lte("scheduled_at", new Date().toISOString())
        .order("priority", { ascending: false })
        .order("scheduled_at", { ascending: true })
        .limit(10)

      if (error) {
        console.error("Failed to fetch jobs:", error)
        return
      }

      for (const job of jobs || []) {
        await this.processJob(job)
      }
    } catch (error) {
      console.error("Job processing error:", error)
    }
  }

  // Process individual job
  private async processJob(job: any): Promise<void> {
    const supabase = await createClient()

    try {
      // Mark job as processing
      await supabase
        .from("job_queue")
        .update({
          status: "processing",
          started_at: new Date().toISOString(),
        })
        .eq("id", job.id)

      // Execute job based on type
      await this.executeJob(job)

      // Mark job as completed
      await supabase
        .from("job_queue")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id)
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)

      const retryCount = job.retry_count + 1

      if (retryCount <= job.max_retries) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, retryCount) * 1000
        const scheduledAt = new Date(Date.now() + retryDelay).toISOString()

        await supabase
          .from("job_queue")
          .update({
            status: "retry",
            retry_count: retryCount,
            scheduled_at: scheduledAt,
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", job.id)
      } else {
        // Mark as failed
        await supabase
          .from("job_queue")
          .update({
            status: "failed",
            failed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", job.id)
      }
    }
  }

  // Execute job based on type
  private async executeJob(job: any): Promise<void> {
    switch (job.type) {
      case "send_email":
        await this.sendEmail(job.data)
        break

      case "send_sms":
        await this.sendSMS(job.data)
        break

      case "process_payment":
        await this.processPayment(job.data)
        break

      case "update_flight_data":
        await this.updateFlightData(job.data)
        break

      case "generate_report":
        await this.generateReport(job.data)
        break

      case "cleanup_expired_sessions":
        await this.cleanupExpiredSessions(job.data)
        break

      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
  }

  // Job implementations
  private async sendEmail(data: any): Promise<void> {
    console.log("Sending email:", data)

    // Mock email sending - replace with actual email service
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Publish event
    await eventBus.publish({
      type: "notification.email.sent",
      source: "job-processor",
      data: {
        to: data.to,
        template: data.template,
        status: "sent",
      },
    })
  }

  private async sendSMS(data: any): Promise<void> {
    console.log("Sending SMS:", data)

    // Mock SMS sending - replace with actual SMS service
    await new Promise((resolve) => setTimeout(resolve, 500))

    await eventBus.publish({
      type: "notification.sms.sent",
      source: "job-processor",
      data: {
        to: data.to,
        message: data.message,
        status: "sent",
      },
    })
  }

  private async processPayment(data: any): Promise<void> {
    console.log("Processing payment:", data)

    // Mock payment processing - replace with actual payment service
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const success = Math.random() > 0.1 // 90% success rate

    if (success) {
      await eventBus.publish({
        type: EventTypes.PAYMENT_COMPLETED,
        source: "job-processor",
        data: {
          payment_id: data.payment_id,
          booking_id: data.booking_id,
          amount: data.amount,
          currency: data.currency,
          customer_email: data.customer_email,
        },
      })
    } else {
      await eventBus.publish({
        type: EventTypes.PAYMENT_FAILED,
        source: "job-processor",
        data: {
          payment_id: data.payment_id,
          booking_id: data.booking_id,
          error: "Payment declined",
        },
      })
    }
  }

  private async updateFlightData(data: any): Promise<void> {
    console.log("Updating flight data:", data)

    const supabase = await createClient()

    // Mock flight data update - replace with actual API calls
    const updates = {
      status: data.status || "scheduled",
      gate: data.gate,
      terminal: data.terminal,
      actual_departure: data.actual_departure,
      actual_arrival: data.actual_arrival,
    }

    await supabase.from("flights").update(updates).eq("id", data.flight_id)

    // Publish flight update event
    await eventBus.publish({
      type: "flight.updated",
      source: "job-processor",
      data: {
        flight_id: data.flight_id,
        updates,
      },
    })
  }

  private async generateReport(data: any): Promise<void> {
    console.log("Generating report:", data)

    // Mock report generation
    await new Promise((resolve) => setTimeout(resolve, 5000))

    await eventBus.publish({
      type: "report.generated",
      source: "job-processor",
      data: {
        report_type: data.report_type,
        report_id: `report_${Date.now()}`,
        status: "completed",
      },
    })
  }

  private async cleanupExpiredSessions(data: any): Promise<void> {
    console.log("Cleaning up expired sessions")

    const supabase = await createClient()

    // Delete expired sessions
    const { data: deletedSessions } = await supabase
      .from("user_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("count")

    console.log(`Cleaned up ${deletedSessions?.length || 0} expired sessions`)
  }
}

// Global job processor instance
export const jobProcessor = new JobProcessor()

// Helper functions to enqueue common jobs
export const Jobs = {
  sendEmail: (to: string, template: string, data: any, priority: Job["priority"] = "normal") =>
    jobProcessor.enqueue({
      type: "send_email",
      data: { to, template, data },
      priority,
    }),

  sendSMS: (to: string, message: string, priority: Job["priority"] = "high") =>
    jobProcessor.enqueue({
      type: "send_sms",
      data: { to, message },
      priority,
    }),

  processPayment: (paymentData: any, priority: Job["priority"] = "high") =>
    jobProcessor.enqueue({
      type: "process_payment",
      data: paymentData,
      priority,
    }),

  updateFlightData: (flightId: string, updates: any, priority: Job["priority"] = "normal") =>
    jobProcessor.enqueue({
      type: "update_flight_data",
      data: { flight_id: flightId, ...updates },
      priority,
    }),

  generateReport: (reportType: string, parameters: any, priority: Job["priority"] = "low") =>
    jobProcessor.enqueue({
      type: "generate_report",
      data: { report_type: reportType, ...parameters },
      priority,
    }),

  scheduleCleanup: (scheduledAt: string) =>
    jobProcessor.enqueue({
      type: "cleanup_expired_sessions",
      data: {},
      priority: "low",
      scheduled_at: scheduledAt,
    }),
}
