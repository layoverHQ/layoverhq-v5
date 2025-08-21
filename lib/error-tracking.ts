import { logger } from "./monitoring"
import { eventBus } from "./event-system"

export interface ErrorContext {
  userId?: string
  requestId?: string
  service: string
  operation?: string
  metadata?: Record<string, any>
}

export interface ErrorReport {
  id: string
  error: Error
  context: ErrorContext
  timestamp: Date
  fingerprint: string
  count: number
  firstSeen: Date
  lastSeen: Date
}

export class ErrorTracker {
  private errorCounts = new Map<string, number>()
  private errorFirstSeen = new Map<string, Date>()

  // Track error
  async trackError(error: Error, context: ErrorContext): Promise<void> {
    try {
      const fingerprint = this.generateFingerprint(error, context)
      const now = new Date()

      // Update error counts
      const currentCount = this.errorCounts.get(fingerprint) || 0
      this.errorCounts.set(fingerprint, currentCount + 1)

      // Track first occurrence
      if (!this.errorFirstSeen.has(fingerprint)) {
        this.errorFirstSeen.set(fingerprint, now)
      }

      // Log error
      await logger.error(context.service, error.message, {
        ...context.metadata,
        operation: context.operation,
        userId: context.userId,
        requestId: context.requestId,
        stack: error.stack,
        fingerprint,
        count: currentCount + 1,
      })

      // Store in database
      await this.storeError(error, context, fingerprint, currentCount + 1)

      // Trigger alerts for critical errors
      if (this.isCriticalError(error, context)) {
        await this.triggerCriticalErrorAlert(error, context)
      }

      // Check for error rate spikes
      await this.checkErrorRateSpike(fingerprint)
    } catch (trackingError) {
      console.error("Failed to track error:", trackingError)
    }
  }

  // Generate error fingerprint for grouping
  private generateFingerprint(error: Error, context: ErrorContext): string {
    const errorType = error.constructor.name
    const errorMessage = error.message.replace(/\d+/g, "N").replace(/[a-f0-9-]{36}/g, "UUID") // Normalize IDs
    const stackTop = error.stack?.split("\n")[1]?.trim() || ""

    return `${errorType}:${errorMessage}:${context.service}:${stackTop}`.slice(0, 255)
  }

  // Store error in database
  private async storeError(
    error: Error,
    context: ErrorContext,
    fingerprint: string,
    count: number,
  ): Promise<void> {
    try {
      const supabase = await (await import("./supabase/server")).createClient()

      await supabase.from("error_reports").upsert(
        {
          fingerprint,
          error_type: error.constructor.name,
          error_message: error.message,
          stack_trace: error.stack,
          service: context.service,
          operation: context.operation,
          user_id: context.userId,
          request_id: context.requestId,
          metadata: context.metadata || {},
          count,
          last_seen: new Date().toISOString(),
        },
        {
          onConflict: "fingerprint",
        },
      )
    } catch (dbError) {
      console.error("Failed to store error in database:", dbError)
    }
  }

  // Check if error is critical
  private isCriticalError(error: Error, context: ErrorContext): boolean {
    const criticalErrors = ["TypeError", "ReferenceError", "SyntaxError"]
    const criticalOperations = ["payment", "booking", "authentication"]

    return (
      criticalErrors.includes(error.constructor.name) ||
      (context.operation && criticalOperations.some((op) => context.operation!.includes(op)))
    )
  }

  // Trigger critical error alert
  private async triggerCriticalErrorAlert(error: Error, context: ErrorContext): Promise<void> {
    await eventBus.publish({
      type: "system.critical_error",
      source: "error-tracker",
      data: {
        error: error.message,
        service: context.service,
        operation: context.operation,
        userId: context.userId,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // Check for error rate spikes
  private async checkErrorRateSpike(fingerprint: string): Promise<void> {
    const count = this.errorCounts.get(fingerprint) || 0
    const firstSeen = this.errorFirstSeen.get(fingerprint)

    if (firstSeen && count > 10) {
      const timeWindow = Date.now() - firstSeen.getTime()
      const errorRate = count / (timeWindow / 1000 / 60) // errors per minute

      if (errorRate > 5) {
        // More than 5 errors per minute
        await eventBus.publish({
          type: "system.error_spike",
          source: "error-tracker",
          data: {
            fingerprint,
            errorRate,
            count,
            timeWindow: timeWindow / 1000,
          },
        })
      }
    }
  }

  // Get error statistics
  async getErrorStats(timeRange = "24h"): Promise<{
    totalErrors: number
    uniqueErrors: number
    topErrors: Array<{ fingerprint: string; count: number; message: string }>
    errorsByService: Record<string, number>
  }> {
    try {
      const supabase = await (await import("./supabase/server")).createClient()
      const hoursBack = timeRange === "7d" ? 168 : timeRange === "24h" ? 24 : 1

      const { data: errors, error } = await supabase
        .from("error_reports")
        .select("*")
        .gte("last_seen", new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString())

      if (error) {
        throw error
      }

      const totalErrors = (errors || []).reduce((sum, err) => sum + err.count, 0)
      const uniqueErrors = (errors || []).length

      const topErrors = (errors || [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((err) => ({
          fingerprint: err.fingerprint,
          count: err.count,
          message: err.error_message,
        }))

      const errorsByService = (errors || []).reduce((acc: Record<string, number>, err) => {
        acc[err.service] = (acc[err.service] || 0) + err.count
        return acc
      }, {})

      return {
        totalErrors,
        uniqueErrors,
        topErrors,
        errorsByService,
      }
    } catch (error) {
      console.error("Failed to get error stats:", error)
      return {
        totalErrors: 0,
        uniqueErrors: 0,
        topErrors: [],
        errorsByService: {},
      }
    }
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker()

// Global error handler
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    errorTracker.trackError(error, {
      service: "global",
      operation: "unhandled_rejection",
      metadata: { promise: promise.toString() },
    })
  })

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    errorTracker.trackError(error, {
      service: "global",
      operation: "uncaught_exception",
    })

    // Exit process after logging
    setTimeout(() => {
      process.exit(1)
    }, 1000)
  })
}

// Error boundary for React components (if needed)
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: Omit<ErrorContext, "metadata">,
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      await errorTracker.trackError(error as Error, {
        ...context,
        metadata: { args: args.length > 0 ? args : undefined },
      })
      throw error
    }
  }) as T
}
