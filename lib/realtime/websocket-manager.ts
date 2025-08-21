import { createClient } from "@/lib/supabase/client"

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
  userId?: string
  channel?: string
}

export interface NotificationPayload {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  userId: string
  read: boolean
  createdAt: string
}

export class WebSocketManager {
  private connections = new Map<string, WebSocket>()
  private channels = new Map<string, Set<string>>()
  private supabase = createClient()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeSupabaseRealtime()
    this.startHeartbeat()
  }

  private initializeSupabaseRealtime() {
    // Subscribe to real-time changes
    this.supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          this.broadcastNotification(payload.new as NotificationPayload)
        },
      )
      .subscribe()

    this.supabase
      .channel("user_activity")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_activity" },
        (payload) => {
          this.broadcastUserActivity(payload)
        },
      )
      .subscribe()

    this.supabase
      .channel("system_metrics")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_metrics" },
        (payload) => {
          this.broadcastSystemMetrics(payload.new)
        },
      )
      .subscribe()
  }

  connect(userId: string, ws: WebSocket): void {
    this.connections.set(userId, ws)

    ws.onopen = () => {
      console.log(`[WebSocket] User ${userId} connected`)
      this.sendMessage(userId, {
        type: "connection_established",
        payload: { userId, timestamp: Date.now() },
        timestamp: Date.now(),
      })
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(userId, message)
      } catch (error) {
        console.error("[WebSocket] Invalid message format:", error)
      }
    }

    ws.onclose = () => {
      console.log(`[WebSocket] User ${userId} disconnected`)
      this.disconnect(userId)
    }

    ws.onerror = (error) => {
      console.error(`[WebSocket] Error for user ${userId}:`, error)
    }
  }

  disconnect(userId: string): void {
    this.connections.delete(userId)
    // Remove user from all channels
    this.channels.forEach((users, channel) => {
      users.delete(userId)
      if (users.size === 0) {
        this.channels.delete(channel)
      }
    })
  }

  joinChannel(userId: string, channel: string): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set())
    }
    this.channels.get(channel)!.add(userId)

    this.sendMessage(userId, {
      type: "channel_joined",
      payload: { channel },
      timestamp: Date.now(),
    })
  }

  leaveChannel(userId: string, channel: string): void {
    const channelUsers = this.channels.get(channel)
    if (channelUsers) {
      channelUsers.delete(userId)
      if (channelUsers.size === 0) {
        this.channels.delete(channel)
      }
    }
  }

  private sendMessage(userId: string, message: WebSocketMessage): void {
    const ws = this.connections.get(userId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private broadcastToChannel(channel: string, message: WebSocketMessage): void {
    const users = this.channels.get(channel)
    if (users) {
      users.forEach((userId) => {
        this.sendMessage(userId, message)
      })
    }
  }

  private broadcastToAll(message: WebSocketMessage): void {
    this.connections.forEach((ws, userId) => {
      this.sendMessage(userId, message)
    })
  }

  private handleMessage(userId: string, message: WebSocketMessage): void {
    switch (message.type) {
      case "join_channel":
        this.joinChannel(userId, message.payload.channel)
        break
      case "leave_channel":
        this.leaveChannel(userId, message.payload.channel)
        break
      case "ping":
        this.sendMessage(userId, {
          type: "pong",
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
        })
        break
      default:
        console.log(`[WebSocket] Unknown message type: ${message.type}`)
    }
  }

  private broadcastNotification(notification: NotificationPayload): void {
    this.sendMessage(notification.userId, {
      type: "notification",
      payload: notification,
      timestamp: Date.now(),
    })
  }

  private broadcastUserActivity(activity: any): void {
    this.broadcastToChannel("admin_dashboard", {
      type: "user_activity",
      payload: activity,
      timestamp: Date.now(),
    })
  }

  private broadcastSystemMetrics(metrics: any): void {
    this.broadcastToChannel("admin_dashboard", {
      type: "system_metrics",
      payload: metrics,
      timestamp: Date.now(),
    })
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((ws, userId) => {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendMessage(userId, {
            type: "heartbeat",
            payload: { timestamp: Date.now() },
            timestamp: Date.now(),
          })
        }
      })
    }, 30000) // 30 seconds
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    this.connections.clear()
    this.channels.clear()
  }
}
