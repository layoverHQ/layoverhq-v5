import { createServiceRoleClient } from "@/lib/supabase/server"

export interface AuditLogEntry {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export class AuditLogger {
  private static supabase = createServiceRoleClient()

  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.supabase.from("audit_logs").insert({
        user_id: entry.userId,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        old_values: entry.oldValues,
        new_values: entry.newValues,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        metadata: entry.metadata,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Audit logging error:", error)
      // Don't throw - audit logging should not break the main flow
    }
  }

  static async logUserAction(
    userId: string,
    action: string,
    details: Partial<AuditLogEntry> = {},
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType: "user_action",
      ...details,
    })
  }

  static async logAdminAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    changes?: { old?: any; new?: any },
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resourceType,
      resourceId,
      oldValues: changes?.old,
      newValues: changes?.new,
    })
  }

  static async logSecurityEvent(
    eventType: string,
    severity: "low" | "medium" | "high" | "critical",
    details: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      // Log to audit_logs table
      await this.log({
        userId,
        action: "security_event",
        resourceType: "security",
        ipAddress,
        userAgent,
        metadata: {
          eventType,
          severity,
          ...details,
        },
      })

      // Also log to security_events table for specialized security monitoring
      await this.supabase.from("security_events").insert({
        event_type: eventType,
        severity,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        details,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Security event logging error:", error)
    }
  }

  static async logPerformanceEvent(
    action: string,
    duration: number,
    details: Record<string, any> = {},
  ): Promise<void> {
    await this.log({
      action: "performance_event",
      resourceType: "performance",
      metadata: {
        duration,
        ...details,
      },
    })
  }

  static async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: "read" | "write" | "delete",
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: `data_${action}`,
      resourceType,
      resourceId,
      ipAddress,
      metadata: {
        accessType: action,
        timestamp: new Date().toISOString(),
      },
    })
  }
}
