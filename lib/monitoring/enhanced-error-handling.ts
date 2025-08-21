/**
 * Enhanced Error Handling and Monitoring System for LayoverHQ
 *
 * Provides comprehensive error tracking, alerting, and recovery mechanisms
 */

import { logger } from "../logger"
import { redisCache } from "../redis-cache"

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  API_ERROR = "api_error",
  DATABASE_ERROR = "database_error",
  EXTERNAL_SERVICE_ERROR = "external_service_error",
  VALIDATION_ERROR = "validation_error",
  AUTHENTICATION_ERROR = "authentication_error",
  RATE_LIMIT_ERROR = "rate_limit_error",
  PERFORMANCE_ERROR = "performance_error",
  BUSINESS_LOGIC_ERROR = "business_logic_error",
}

export interface ErrorContext {
  service: string
  operation: string
  userId?: string
  requestId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
  metadata?: any
}

export interface ErrorMetric {
  id: string
  timestamp: number
  message: string
  stack?: string
  severity: ErrorSeverity
  category: ErrorCategory
  context: ErrorContext
  resolved: boolean
  occurrenceCount: number
  firstOccurrence: number
  lastOccurrence: number
}

export interface CircuitBreakerState {
  serviceName: string
  state: "CLOSED" | "OPEN" | "HALF_OPEN"
  failureCount: number
  lastFailureTime: number
  nextAttemptTime: number
  successCount: number
}

export class EnhancedErrorHandler {
  private static instance: EnhancedErrorHandler
  private errors: Map<string, ErrorMetric> = new Map()
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()

  // Circuit breaker thresholds
  private readonly circuitBreakerConfig = {
    failureThreshold: 5,
    timeout: 60000, // 1 minute
    halfOpenMaxCalls: 3,
  }

  private constructor() {}

  static getInstance(): EnhancedErrorHandler {
    if (!EnhancedErrorHandler.instance) {
      EnhancedErrorHandler.instance = new EnhancedErrorHandler()
    }
    return EnhancedErrorHandler.instance
  }

  /**
   * Track and handle an error
   */
  async handleError(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.API_ERROR,
  ): Promise<void> {
    const errorId = this.generateErrorId(error, context)
    const timestamp = Date.now()

    // Get or create error metric
    let errorMetric = this.errors.get(errorId)

    if (errorMetric) {
      // Update existing error
      errorMetric.occurrenceCount++
      errorMetric.lastOccurrence = timestamp
      errorMetric.severity = this.escalateSeverity(errorMetric.severity, severity)
    } else {
      // Create new error metric
      errorMetric = {
        id: errorId,
        timestamp,
        message: error.message,
        stack: error.stack,
        severity,
        category,
        context,
        resolved: false,
        occurrenceCount: 1,
        firstOccurrence: timestamp,
        lastOccurrence: timestamp,
      }
    }

    this.errors.set(errorId, errorMetric)

    // Log the error
    await this.logError(errorMetric)

    // Handle circuit breaker logic
    await this.updateCircuitBreaker(context.service, false)

    // Store for persistence and alerting
    await this.persistError(errorMetric)

    // Check if immediate alerting is needed
    await this.checkAlertingThresholds(errorMetric)
  }

  /**
   * Circuit breaker for external service calls
   */
  async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(serviceName)

    if (breaker.state === "OPEN") {
      if (Date.now() < breaker.nextAttemptTime) {
        if (fallback) {
          logger.warn(`Circuit breaker OPEN for ${serviceName}, using fallback`)
          return await fallback()
        }
        throw new Error(`Circuit breaker OPEN for service: ${serviceName}`)
      } else {
        // Transition to HALF_OPEN
        breaker.state = "HALF_OPEN"
        breaker.successCount = 0
      }
    }

    try {
      const result = await operation()
      await this.updateCircuitBreaker(serviceName, true)
      return result
    } catch (error) {
      await this.updateCircuitBreaker(serviceName, false)

      if (fallback && breaker.state !== "CLOSED") {
        logger.warn(`Service ${serviceName} failed, using fallback`)
        return await fallback()
      }

      throw error
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context?: ErrorContext,
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) {
          if (context) {
            await this.handleError(
              lastError,
              { ...context, metadata: { ...context.metadata, attempt, maxRetries } },
              ErrorSeverity.HIGH,
              ErrorCategory.API_ERROR,
            )
          }
          throw lastError
        }

        const delay = baseDelay * Math.pow(2, attempt)
        const jitter = Math.random() * 0.1 * delay
        const totalDelay = delay + jitter

        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${totalDelay}ms`, {
          error: lastError.message,
          context,
        })

        await new Promise((resolve) => setTimeout(resolve, totalDelay))
      }
    }

    throw lastError!
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeWindow: number = 3600000): {
    totalErrors: number
    errorsByCategory: { [key in ErrorCategory]?: number }
    errorsBySeverity: { [key in ErrorSeverity]?: number }
    topErrors: ErrorMetric[]
    unresolvedErrors: number
  } {
    const cutoff = Date.now() - timeWindow
    const recentErrors = Array.from(this.errors.values()).filter(
      (error) => error.lastOccurrence > cutoff,
    )

    const errorsByCategory: { [key in ErrorCategory]?: number } = {}
    const errorsBySeverity: { [key in ErrorSeverity]?: number } = {}

    recentErrors.forEach((error) => {
      errorsByCategory[error.category] =
        (errorsByCategory[error.category] || 0) + error.occurrenceCount
      errorsBySeverity[error.severity] =
        (errorsBySeverity[error.severity] || 0) + error.occurrenceCount
    })

    const topErrors = recentErrors
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 10)

    const unresolvedErrors = recentErrors.filter((error) => !error.resolved).length

    return {
      totalErrors: recentErrors.reduce((sum, error) => sum + error.occurrenceCount, 0),
      errorsByCategory,
      errorsBySeverity,
      topErrors,
      unresolvedErrors,
    }
  }

  /**
   * Get circuit breaker status for all services
   */
  getCircuitBreakerStatus(): CircuitBreakerState[] {
    return Array.from(this.circuitBreakers.values())
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorId: string): boolean {
    const error = this.errors.get(errorId)
    if (error) {
      error.resolved = true
      return true
    }
    return false
  }

  /**
   * Generate health score based on error patterns
   */
  calculateHealthScore(): {
    score: number // 0-100
    factors: {
      errorRate: number
      criticalErrors: number
      unresolvedErrors: number
      circuitBreakersOpen: number
    }
  } {
    const stats = this.getErrorStats()
    const circuitBreakers = this.getCircuitBreakerStatus()

    let score = 100

    // Error rate impact (0-40 points)
    const errorRate = stats.totalErrors / 100 // Normalize
    score -= Math.min(errorRate * 40, 40)

    // Critical errors impact (0-30 points)
    const criticalErrors = stats.errorsBySeverity[ErrorSeverity.CRITICAL] || 0
    score -= Math.min(criticalErrors * 10, 30)

    // Unresolved errors impact (0-20 points)
    score -= Math.min(stats.unresolvedErrors * 2, 20)

    // Circuit breakers open impact (0-10 points)
    const openBreakers = circuitBreakers.filter((cb) => cb.state === "OPEN").length
    score -= Math.min(openBreakers * 5, 10)

    return {
      score: Math.max(score, 0),
      factors: {
        errorRate,
        criticalErrors,
        unresolvedErrors: stats.unresolvedErrors,
        circuitBreakersOpen: openBreakers,
      },
    }
  }

  private generateErrorId(error: Error, context: ErrorContext): string {
    const key = `${context.service}_${context.operation}_${error.message.substring(0, 50)}`
    return Buffer.from(key).toString("base64").substring(0, 16)
  }

  private escalateSeverity(current: ErrorSeverity, new_: ErrorSeverity): ErrorSeverity {
    const severityOrder = [
      ErrorSeverity.LOW,
      ErrorSeverity.MEDIUM,
      ErrorSeverity.HIGH,
      ErrorSeverity.CRITICAL,
    ]
    const currentIndex = severityOrder.indexOf(current)
    const newIndex = severityOrder.indexOf(new_)
    return severityOrder[Math.max(currentIndex, newIndex)]
  }

  private async logError(errorMetric: ErrorMetric): Promise<void> {
    const logLevel = this.getLogLevel(errorMetric.severity)

    logger[logLevel]("🚨 Error tracked", {
      errorId: errorMetric.id,
      message: errorMetric.message,
      severity: errorMetric.severity,
      category: errorMetric.category,
      occurrenceCount: errorMetric.occurrenceCount,
      context: errorMetric.context,
    })
  }

  private getLogLevel(severity: ErrorSeverity): "info" | "warn" | "error" {
    switch (severity) {
      case ErrorSeverity.LOW:
        return "info"
      case ErrorSeverity.MEDIUM:
        return "warn"
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return "error"
      default:
        return "warn"
    }
  }

  private getCircuitBreaker(serviceName: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, {
        serviceName,
        state: "CLOSED",
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        successCount: 0,
      })
    }
    return this.circuitBreakers.get(serviceName)!
  }

  private async updateCircuitBreaker(serviceName: string, success: boolean): Promise<void> {
    const breaker = this.getCircuitBreaker(serviceName)

    if (success) {
      if (breaker.state === "HALF_OPEN") {
        breaker.successCount++
        if (breaker.successCount >= this.circuitBreakerConfig.halfOpenMaxCalls) {
          breaker.state = "CLOSED"
          breaker.failureCount = 0
        }
      } else if (breaker.state === "CLOSED") {
        breaker.failureCount = Math.max(0, breaker.failureCount - 1)
      }
    } else {
      breaker.failureCount++
      breaker.lastFailureTime = Date.now()

      if (breaker.failureCount >= this.circuitBreakerConfig.failureThreshold) {
        breaker.state = "OPEN"
        breaker.nextAttemptTime = Date.now() + this.circuitBreakerConfig.timeout

        logger.error(`Circuit breaker OPENED for service: ${serviceName}`, {
          failureCount: breaker.failureCount,
          nextAttemptTime: new Date(breaker.nextAttemptTime).toISOString(),
        })
      }
    }
  }

  private async persistError(errorMetric: ErrorMetric): Promise<void> {
    try {
      const key = `error_metrics_${new Date().toISOString().split("T")[0]}`
      const existingErrors =
        (await redisCache.get(key, {
          keyPrefix: "layoverhq",
          useLocalFallback: false,
        })) || []

      if (Array.isArray(existingErrors)) {
        existingErrors.push(errorMetric)
      }

      await redisCache.set(key, existingErrors, {
        ttl: 86400000 * 7, // 7 days
        keyPrefix: "layoverhq",
      })
    } catch (error) {
      logger.error("Failed to persist error metric", { error })
    }
  }

  private async checkAlertingThresholds(errorMetric: ErrorMetric): Promise<void> {
    // Critical errors should be alerted immediately
    if (errorMetric.severity === ErrorSeverity.CRITICAL) {
      await this.sendAlert(errorMetric, "CRITICAL_ERROR")
    }

    // High frequency errors
    if (errorMetric.occurrenceCount >= 10 && errorMetric.severity !== ErrorSeverity.LOW) {
      await this.sendAlert(errorMetric, "HIGH_FREQUENCY_ERROR")
    }

    // Service degradation patterns
    const recentErrors = Array.from(this.errors.values()).filter(
      (error) =>
        error.context.service === errorMetric.context.service &&
        error.lastOccurrence > Date.now() - 300000, // Last 5 minutes
    )

    if (recentErrors.length >= 5) {
      await this.sendAlert(errorMetric, "SERVICE_DEGRADATION")
    }
  }

  private async sendAlert(errorMetric: ErrorMetric, alertType: string): Promise<void> {
    // In production, this would integrate with alerting systems like:
    // - Slack webhooks
    // - PagerDuty
    // - Email notifications
    // - SMS alerts

    logger.error(`🚨 ALERT: ${alertType}`, {
      errorId: errorMetric.id,
      message: errorMetric.message,
      severity: errorMetric.severity,
      occurrenceCount: errorMetric.occurrenceCount,
      service: errorMetric.context.service,
      operation: errorMetric.context.operation,
    })

    // Store alert for dashboard
    try {
      const alertKey = `alerts_${new Date().toISOString().split("T")[0]}`
      const alerts =
        (await redisCache.get(alertKey, {
          keyPrefix: "layoverhq",
          useLocalFallback: false,
        })) || []

      if (Array.isArray(alerts)) {
        alerts.push({
          timestamp: Date.now(),
          type: alertType,
          errorId: errorMetric.id,
          severity: errorMetric.severity,
          message: errorMetric.message,
          service: errorMetric.context.service,
        })
      }

      await redisCache.set(alertKey, alerts, {
        ttl: 86400000 * 3, // 3 days
        keyPrefix: "layoverhq",
      })
    } catch (error) {
      logger.error("Failed to store alert", { error })
    }
  }
}

// Export singleton instance
export const enhancedErrorHandler = EnhancedErrorHandler.getInstance()

// Utility functions for common error patterns
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  options?: {
    severity?: ErrorSeverity
    category?: ErrorCategory
    fallback?: () => Promise<T>
    retries?: number
  },
): Promise<T> => {
  try {
    if (options?.retries && options.retries > 0) {
      return await enhancedErrorHandler.retryWithBackoff(operation, options.retries, 1000, context)
    }
    return await operation()
  } catch (error) {
    await enhancedErrorHandler.handleError(
      error as Error,
      context,
      options?.severity || ErrorSeverity.MEDIUM,
      options?.category || ErrorCategory.API_ERROR,
    )

    if (options?.fallback) {
      return await options.fallback()
    }

    throw error
  }
}
