import { createClient } from "@/lib/supabase/client"

export interface UserActivity {
  userId: string
  action: string
  resource?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp?: string
}

export class ActivityTracker {
  private supabase = createClient()
  private activityBuffer: UserActivity[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startPeriodicFlush()
  }

  async trackActivity(activity: UserActivity): Promise<void> {
    // Add to buffer for batch processing
    this.activityBuffer.push({
      ...activity,
      timestamp: new Date().toISOString(),
    })

    // If buffer is getting full, flush immediately
    if (this.activityBuffer.length >= 100) {
      await this.flushActivities()
    }
  }

  private async flushActivities(): Promise<void> {
    if (this.activityBuffer.length === 0) return

    try {
      const activities = this.activityBuffer.splice(0)

      const { error } = await this.supabase.from("user_activity").insert(
        activities.map((activity) => ({
          user_id: activity.userId,
          action: activity.action,
          resource: activity.resource,
          details: activity.details,
          ip_address: activity.ipAddress,
          user_agent: activity.userAgent,
          created_at: activity.timestamp,
        })),
      )

      if (error) {
        console.error("Flush activities error:", error)
        // Re-add failed activities to buffer
        this.activityBuffer.unshift(...activities)
      }
    } catch (error) {
      console.error("Activity tracking error:", error)
    }
  }

  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushActivities()
    }, 10000) // Flush every 10 seconds
  }

  async getRecentActivity(limit = 100): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("user_activity")
        .select(
          `
          *,
          profiles:user_id (
            email,
            first_name,
            last_name,
            display_name
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Get recent activity error:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Get recent activity error:", error)
      return []
    }
  }

  async getUserActivity(userId: string, limit = 50): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Get user activity error:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Get user activity error:", error)
      return []
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushActivities() // Final flush
  }
}
