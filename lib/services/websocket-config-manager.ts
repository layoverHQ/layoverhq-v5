/**
 * WebSocket-based Configuration Propagation System
 *
 * Real-time configuration updates without service restarts.
 * Propagates configuration changes across all connected clients instantly.
 */

import { EventEmitter } from "events"
import { WebSocket } from "ws"
import { getConfigManager } from "./config-manager"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export interface ConfigChangeEvent {
  type: "config_changed" | "config_bulk_update" | "config_rollback" | "feature_flag_changed"
  key?: string
  keys?: string[]
  value?: any
  tenant_id?: string
  environment?: string
  user_id: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface WebSocketClient {
  id: string
  socket: WebSocket
  user_id: string
  tenant_id?: string
  subscriptions: Set<string>
  last_ping: Date
  ip_address?: string
  user_agent?: string
}

export interface SubscriptionFilter {
  config_keys?: string[]
  categories?: string[]
  tenant_id?: string
  environment?: string
}

class WebSocketConfigManager extends EventEmitter {
  private clients = new Map<string, WebSocketClient>()
  private configManager = getConfigManager()
  private supabase = createServiceRoleClient()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 30000 // 30 seconds
  private readonly CLIENT_TIMEOUT = 60000 // 60 seconds

  constructor() {
    super()
    this.setupConfigListener()
    this.startHeartbeat()
    this.startCleanup()
  }

  /**
   * Register a new WebSocket client
   */
  registerClient(
    socket: WebSocket,
    clientId: string,
    userId: string,
    tenantId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): void {
    const client: WebSocketClient = {
      id: clientId,
      socket,
      user_id: userId,
      tenant_id: tenantId,
      subscriptions: new Set(),
      last_ping: new Date(),
      ip_address: ipAddress,
      user_agent: userAgent,
    }

    this.clients.set(clientId, client)

    // Set up socket event handlers
    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleClientMessage(clientId, message)
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    })

    socket.on("close", () => {
      this.unregisterClient(clientId)
    })

    socket.on("error", (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error)
      this.unregisterClient(clientId)
    })

    // Send welcome message
    this.sendToClient(clientId, {
      type: "connected",
      client_id: clientId,
      timestamp: new Date().toISOString(),
    })

    this.emit("client_connected", { clientId, userId, tenantId })

    console.log(`WebSocket client ${clientId} connected for user ${userId}`)
  }

  /**
   * Unregister a WebSocket client
   */
  unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      try {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.close()
        }
      } catch (error) {
        console.error("Error closing WebSocket:", error)
      }

      this.clients.delete(clientId)
      this.emit("client_disconnected", { clientId, userId: client.user_id })

      console.log(`WebSocket client ${clientId} disconnected`)
    }
  }

  /**
   * Handle incoming client messages
   */
  private handleClientMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId)
    if (!client) return

    switch (message.type) {
      case "ping":
        client.last_ping = new Date()
        this.sendToClient(clientId, {
          type: "pong",
          timestamp: new Date().toISOString(),
        })
        break

      case "subscribe":
        this.handleSubscription(clientId, message.filter)
        break

      case "unsubscribe":
        this.handleUnsubscription(clientId, message.filter)
        break

      case "get_config":
        this.handleConfigRequest(clientId, message.key, message.tenant_id)
        break

      default:
        console.warn(`Unknown message type: ${message.type}`)
    }
  }

  /**
   * Handle client subscription to configuration changes
   */
  private handleSubscription(clientId: string, filter: SubscriptionFilter): void {
    const client = this.clients.get(clientId)
    if (!client) return

    // Create subscription key based on filter
    const subscriptionKey = this.createSubscriptionKey(filter)
    client.subscriptions.add(subscriptionKey)

    this.sendToClient(clientId, {
      type: "subscribed",
      filter,
      subscription_key: subscriptionKey,
      timestamp: new Date().toISOString(),
    })

    console.log(`Client ${clientId} subscribed to: ${subscriptionKey}`)
  }

  /**
   * Handle client unsubscription
   */
  private handleUnsubscription(clientId: string, filter: SubscriptionFilter): void {
    const client = this.clients.get(clientId)
    if (!client) return

    const subscriptionKey = this.createSubscriptionKey(filter)
    client.subscriptions.delete(subscriptionKey)

    this.sendToClient(clientId, {
      type: "unsubscribed",
      filter,
      subscription_key: subscriptionKey,
      timestamp: new Date().toISOString(),
    })

    console.log(`Client ${clientId} unsubscribed from: ${subscriptionKey}`)
  }

  /**
   * Handle real-time configuration request
   */
  private async handleConfigRequest(
    clientId: string,
    key: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      const value = await this.configManager.get(key, tenantId)

      this.sendToClient(clientId, {
        type: "config_value",
        key,
        value,
        tenant_id: tenantId,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error handling config request:", error)
      this.sendToClient(clientId, {
        type: "error",
        message: "Failed to retrieve configuration",
        key,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Broadcast configuration change to relevant clients
   */
  broadcastConfigChange(event: ConfigChangeEvent): void {
    const relevantClients = this.getRelevantClients(event)

    relevantClients.forEach((client) => {
      this.sendToClient(client.id, {
        type: "config_update",
        ...event,
      })
    })

    // Log the broadcast
    this.logConfigBroadcast(event, relevantClients.length)
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId)
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      client.socket.send(JSON.stringify(message))
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error)
      this.unregisterClient(clientId)
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(message: any): void {
    this.clients.forEach((client) => {
      this.sendToClient(client.id, message)
    })
  }

  /**
   * Get clients that should receive a specific configuration change
   */
  private getRelevantClients(event: ConfigChangeEvent): WebSocketClient[] {
    return Array.from(this.clients.values()).filter((client) => {
      // Check tenant isolation
      if (event.tenant_id && client.tenant_id !== event.tenant_id) {
        return false
      }

      // Check if client has relevant subscriptions
      if (client.subscriptions.size === 0) {
        return false // Not subscribed to anything
      }

      // Check subscription filters
      for (const subscription of client.subscriptions) {
        if (this.matchesSubscription(event, subscription)) {
          return true
        }
      }

      return false
    })
  }

  /**
   * Check if an event matches a subscription filter
   */
  private matchesSubscription(event: ConfigChangeEvent, subscription: string): boolean {
    const filter = this.parseSubscriptionKey(subscription)

    // Check config keys
    if (filter.config_keys && event.key) {
      if (!filter.config_keys.includes(event.key)) {
        return false
      }
    }

    // Check bulk keys
    if (filter.config_keys && event.keys) {
      const hasMatch = event.keys.some((key) => filter.config_keys!.includes(key))
      if (!hasMatch) {
        return false
      }
    }

    // Check categories
    if (filter.categories && event.key) {
      const schema = this.configManager.getSchema()
      const configCategory = schema[event.key]?.category
      if (configCategory && !filter.categories.includes(configCategory)) {
        return false
      }
    }

    // Check tenant
    if (filter.tenant_id && event.tenant_id !== filter.tenant_id) {
      return false
    }

    // Check environment
    if (filter.environment && event.environment !== filter.environment) {
      return false
    }

    return true
  }

  /**
   * Create subscription key from filter
   */
  private createSubscriptionKey(filter: SubscriptionFilter): string {
    const parts = []

    if (filter.config_keys) {
      parts.push(`keys:${filter.config_keys.join(",")}`)
    }

    if (filter.categories) {
      parts.push(`categories:${filter.categories.join(",")}`)
    }

    if (filter.tenant_id) {
      parts.push(`tenant:${filter.tenant_id}`)
    }

    if (filter.environment) {
      parts.push(`env:${filter.environment}`)
    }

    return parts.join("|") || "all"
  }

  /**
   * Parse subscription key back to filter
   */
  private parseSubscriptionKey(key: string): SubscriptionFilter {
    if (key === "all") {
      return {}
    }

    const filter: SubscriptionFilter = {}
    const parts = key.split("|")

    parts.forEach((part) => {
      const [type, value] = part.split(":")
      switch (type) {
        case "keys":
          filter.config_keys = value.split(",")
          break
        case "categories":
          filter.categories = value.split(",")
          break
        case "tenant":
          filter.tenant_id = value
          break
        case "env":
          filter.environment = value
          break
      }
    })

    return filter
  }

  /**
   * Set up listener for configuration changes
   */
  private setupConfigListener(): void {
    this.configManager.on("configChanged", (data) => {
      this.broadcastConfigChange({
        type: "config_changed",
        key: data.key,
        value: data.value,
        tenant_id: data.tenantId,
        user_id: data.userId,
        timestamp: new Date().toISOString(),
      })
    })

    this.configManager.on("cacheRefreshed", () => {
      this.broadcastToAll({
        type: "cache_refreshed",
        timestamp: new Date().toISOString(),
      })
    })
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (client.socket.readyState === WebSocket.OPEN) {
          this.sendToClient(client.id, {
            type: "heartbeat",
            timestamp: new Date().toISOString(),
          })
        }
      })
    }, this.HEARTBEAT_INTERVAL)
  }

  /**
   * Start cleanup of stale connections
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = new Date()
      const staleClients: string[] = []

      this.clients.forEach((client, clientId) => {
        const timeSinceLastPing = now.getTime() - client.last_ping.getTime()

        if (timeSinceLastPing > this.CLIENT_TIMEOUT) {
          staleClients.push(clientId)
        }
      })

      staleClients.forEach((clientId) => {
        console.log(`Cleaning up stale client: ${clientId}`)
        this.unregisterClient(clientId)
      })
    }, this.CLIENT_TIMEOUT)
  }

  /**
   * Log configuration broadcast for monitoring
   */
  private async logConfigBroadcast(event: ConfigChangeEvent, clientCount: number): Promise<void> {
    try {
      await this.supabase.from("enterprise_audit_logs").insert({
        event_type: "configuration",
        entity_type: "websocket_broadcast",
        action: "config_broadcast",
        actor_id: event.user_id,
        tenant_id: event.tenant_id,
        metadata: {
          ...event,
          client_count: clientCount,
        },
        risk_score: 1,
      })
    } catch (error) {
      console.error("Error logging config broadcast:", error)
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    total_clients: number
    clients_by_tenant: Record<string, number>
    total_subscriptions: number
    uptime_seconds: number
  } {
    const clientsByTenant: Record<string, number> = {}
    let totalSubscriptions = 0

    this.clients.forEach((client) => {
      const tenantKey = client.tenant_id || "global"
      clientsByTenant[tenantKey] = (clientsByTenant[tenantKey] || 0) + 1
      totalSubscriptions += client.subscriptions.size
    })

    return {
      total_clients: this.clients.size,
      clients_by_tenant: clientsByTenant,
      total_subscriptions: totalSubscriptions,
      uptime_seconds: Math.floor(process.uptime()),
    }
  }

  /**
   * Force disconnect all clients (for maintenance)
   */
  disconnectAllClients(reason = "Server maintenance"): void {
    this.broadcastToAll({
      type: "server_shutdown",
      reason,
      timestamp: new Date().toISOString(),
    })

    // Give clients time to receive the message
    setTimeout(() => {
      this.clients.forEach((_, clientId) => {
        this.unregisterClient(clientId)
      })
    }, 1000)
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    this.disconnectAllClients("Server shutdown")
    this.removeAllListeners()
  }
}

// Singleton instance
let wsConfigManagerInstance: WebSocketConfigManager | null = null

export function getWebSocketConfigManager(): WebSocketConfigManager {
  if (!wsConfigManagerInstance) {
    wsConfigManagerInstance = new WebSocketConfigManager()
  }
  return wsConfigManagerInstance
}

export default WebSocketConfigManager
