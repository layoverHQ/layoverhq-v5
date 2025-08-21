import { createClient } from "@/lib/supabase/client"

export interface Notification {
  id?: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  category?: string
  actionUrl?: string
  read?: boolean
  createdAt?: string
}

export class NotificationService {
  private supabase = createClient()

  async createNotification(notification: Notification): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from("notifications")
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category || "general",
          action_url: notification.actionUrl,
          read: false,
        })
        .select("id")
        .single()

      if (error) {
        console.error("Create notification error:", error)
        return null
      }

      return data.id
    } catch (error) {
      console.error("Notification service error:", error)
      return null
    }
  }

  async getNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Get notifications error:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Get notifications error:", error)
      return []
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)

      return !error
    } catch (error) {
      console.error("Mark notification as read error:", error)
      return false
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("read", false)

      return !error
    } catch (error) {
      console.error("Mark all notifications as read error:", error)
      return false
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false)

      if (error) {
        console.error("Get unread count error:", error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error("Get unread count error:", error)
      return 0
    }
  }

  // Predefined notification templates
  async notifyUserCreated(adminId: string, newUserEmail: string): Promise<void> {
    await this.createNotification({
      userId: adminId,
      title: "New User Created",
      message: `User ${newUserEmail} has been successfully created`,
      type: "success",
      category: "user_management",
    })
  }

  async notifySecurityAlert(adminId: string, alertType: string, details: string): Promise<void> {
    await this.createNotification({
      userId: adminId,
      title: "Security Alert",
      message: `${alertType}: ${details}`,
      type: "warning",
      category: "security",
    })
  }

  async notifySystemError(adminId: string, error: string): Promise<void> {
    await this.createNotification({
      userId: adminId,
      title: "System Error",
      message: error,
      type: "error",
      category: "system",
    })
  }
}
