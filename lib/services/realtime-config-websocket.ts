/**
 * Real-Time Configuration WebSocket System
 *
 * WebSocket-based system for real-time configuration propagation,
 * enabling instant updates across all connected clients without
 * requiring page refreshes or service restarts.
 */

import { EventEmitter } from "events"
import { WebSocket, WebSocketServer } from "ws"
import { createClient } from "@/lib/supabase/server"
import { getConfigManager } from "@/lib/services/config-manager"
import { Redis } from "@upstash/redis"

export interface ConfigChangeEvent {
  type: "config_changed" | "tenant_updated" | "feature_toggled" | "system_alert"
  tenant_id?: string
  key?: string
  value?: any
  old_value?: any
  user_id: string
  timestamp: string
  environment?: string
  hot_reload: boolean
  requires_restart?: boolean
}

export interface WebSocketConnection {
  id: string
  ws: WebSocket
  tenant_id?: string
  user_id: string
  subscriptions: Set<string>
  connected_at: Date
  last_ping: Date
  is_admin: boolean
}

export interface SubscriptionFilter {
  tenant_id?: string
  config_keys?: string[]
  categories?: string[]
  event_types?: string[]
}

class RealTimeConfigWebSocket extends EventEmitter {
  private wss: WebSocketServer | null = null
  private connections = new Map<string, WebSocketConnection>()
  private redis: Redis
  private configManager: any
  private pingInterval: NodeJS.Timeout | null = null
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    this.configManager = getConfigManager()

    // Listen for configuration changes
    this.configManager.on("configChanged", this.handleConfigChange.bind(this))
    this.configManager.on("bulkConfigChanged", this.handleBulkConfigChange.bind(this))

    this.setupCleanupIntervals()
  }

  /**
   * Initialize WebSocket server
   */
  public initialize(server?: any): void {
    if (this.wss) {
      console.warn("[WebSocket] Server already initialized")
      return
    }

    this.wss = new WebSocketServer({
      port: process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : 8080,
      server,
    })

    this.wss.on("connection", this.handleConnection.bind(this))
    this.wss.on("error", this.handleServerError.bind(this))

    console.log(
      `[WebSocket] Configuration WebSocket server started on port ${process.env.WEBSOCKET_PORT || 8080}`,
    )
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, request: any): Promise<void> {
    const connectionId = this.generateConnectionId()
    const url = new URL(request.url, `http://${request.headers.host}`)

    // Extract authentication from query params or headers
    const token = url.searchParams.get("token") || request.headers.authorization?.split(" ")[1]
    const tenantId = url.searchParams.get("tenant_id")

    if (!token) {
      ws.close(1008, "Authentication required")
      return
    }

    // Validate token and get user info
    const userInfo = await this.validateToken(token)
    if (!userInfo) {
      ws.close(1008, "Invalid authentication token")
      return
    }

    // Create connection record
    const connection: WebSocketConnection = {
      id: connectionId,
      ws,
      tenant_id: tenantId || userInfo.tenant_id,
      user_id: userInfo.user_id,
      subscriptions: new Set(),
      connected_at: new Date(),
      last_ping: new Date(),
      is_admin: userInfo.is_admin || false,
    }

    this.connections.set(connectionId, connection)

    // Set up connection event handlers
    ws.on("message", (data) => this.handleMessage(connectionId, data))
    ws.on("close", () => this.handleDisconnection(connectionId))
    ws.on("error", (error) => this.handleConnectionError(connectionId, error))
    ws.on("pong", () => this.handlePong(connectionId))

    // Send welcome message
    this.sendMessage(connectionId, {
      type: "connection_established",
      connection_id: connectionId,
      server_time: new Date().toISOString(),
      capabilities: {
        config_sync: true,
        real_time_updates: true,
        bulk_operations: true,
        admin_features: connection.is_admin,
      },
    })

    // Auto-subscribe to relevant configurations
    await this.autoSubscribe(connectionId)

    console.log(
      `[WebSocket] New connection established: ${connectionId} for user ${userInfo.user_id}`,
    )
  }

  /**
   * Handle incoming messages from clients
   */
  private async handleMessage(connectionId: string, data: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      const message = JSON.parse(data.toString())

      switch (message.type) {
        case "subscribe":
          await this.handleSubscription(connectionId, message)
          break

        case "unsubscribe":
          await this.handleUnsubscription(connectionId, message)
          break

        case "config_update":
          await this.handleConfigUpdate(connectionId, message)
          break

        case "bulk_config_update":
          await this.handleBulkConfigUpdate(connectionId, message)
          break

        case "ping":
          this.handlePing(connectionId)
          break

        case "get_current_config":
          this.sendError(connectionId, "not_implemented", "Get current config not implemented")
          break

        default:
          this.sendError(
            connectionId,
            "unknown_message_type",
            `Unknown message type: ${message.type}`,
          )
      }
    } catch (error) {
      console.error(`[WebSocket] Error handling message from ${connectionId}:`, error)
      this.sendError(connectionId, "message_parse_error", "Failed to parse message")
    }
  }

  /**
   * Handle subscription requests
   */
  private async handleSubscription(connectionId: string, message: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const { filters } = message
    const subscriptionKey = this.generateSubscriptionKey(filters)

    // Validate subscription permissions
    if (!(await this.validateSubscriptionPermissions(connection, filters))) {
      this.sendError(connectionId, "permission_denied", "Insufficient permissions for subscription")
      return
    }

    connection.subscriptions.add(subscriptionKey)

    // Store subscription in Redis for cross-server synchronization
    await this.redis.sadd(`subscriptions:${connectionId}`, subscriptionKey)
    await this.redis.expire(`subscriptions:${connectionId}`, 3600) // 1 hour TTL

    this.sendMessage(connectionId, {
      type: "subscription_confirmed",
      subscription_key: subscriptionKey,
      filters,
    })

    console.log(`[WebSocket] Connection ${connectionId} subscribed to ${subscriptionKey}`)
  }

  /**
   * Handle unsubscription requests
   */
  private async handleUnsubscription(connectionId: string, message: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const { subscription_key } = message

    connection.subscriptions.delete(subscription_key)
    await this.redis.srem(`subscriptions:${connectionId}`, subscription_key)

    this.sendMessage(connectionId, {
      type: "unsubscription_confirmed",
      subscription_key,
    })
  }

  /**
   * Handle configuration updates from clients
   */
  private async handleConfigUpdate(connectionId: string, message: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const { key, value, environment = "all" } = message

    // Validate permissions for config updates
    if (!(await this.validateConfigUpdatePermissions(connection, key))) {
      this.sendError(
        connectionId,
        "permission_denied",
        "Insufficient permissions for config update",
      )
      return
    }

    try {
      // Update configuration through ConfigManager
      const success = await this.configManager.set(
        key,
        value,
        connection.user_id,
        connection.tenant_id,
      )

      if (success) {
        this.sendMessage(connectionId, {
          type: "config_update_confirmed",
          key,
          value,
          timestamp: new Date().toISOString(),
        })
      } else {
        this.sendError(connectionId, "config_update_failed", "Failed to update configuration")
      }
    } catch (error) {
      console.error(`[WebSocket] Config update error:`, error)
      this.sendError(
        connectionId,
        "config_update_error",
        error instanceof Error ? error.message : "Unknown error",
      )
    }
  }

  /**
   * Handle bulk configuration updates
   */
  private async handleBulkConfigUpdate(connectionId: string, message: any): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Only allow bulk updates for admin users
    if (!connection.is_admin) {
      this.sendError(connectionId, "permission_denied", "Bulk updates require admin privileges")
      return
    }

    const { configs } = message

    try {
      const result = await this.configManager.setBulk(
        configs,
        connection.user_id,
        connection.tenant_id,
      )

      if (result.success) {
        this.sendMessage(connectionId, {
          type: "bulk_config_update_confirmed",
          updated_count: Object.keys(configs).length,
          timestamp: new Date().toISOString(),
        })
      } else {
        this.sendError(connectionId, "bulk_config_update_failed", result.errors.join(", "))
      }
    } catch (error) {
      console.error(`[WebSocket] Bulk config update error:`, error)
      this.sendError(
        connectionId,
        "bulk_config_update_error",
        error instanceof Error ? error.message : "Unknown error",
      )
    }
  }

  /**
   * Handle ping messages
   */
  private handlePing(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.last_ping = new Date()
    this.sendMessage(connectionId, {
      type: "pong",
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Handle pong responses
   */
  private handlePong(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.last_ping = new Date()
    }
  }

  /**
   * Handle configuration changes from ConfigManager
   */
  private async handleConfigChange(event: any): Promise<void> {
    const configChangeEvent: ConfigChangeEvent = {
      type: "config_changed",
      tenant_id: event.tenantId,
      key: event.key,
      value: event.value,
      user_id: event.userId,
      timestamp: new Date().toISOString(),
      hot_reload: true, // Assume hot reload by default
    }

    await this.broadcastConfigChange(configChangeEvent)
  }

  /**
   * Handle bulk configuration changes
   */
  private async handleBulkConfigChange(event: any): Promise<void> {
    const configChangeEvent: ConfigChangeEvent = {
      type: "config_changed",
      tenant_id: event.tenantId,
      user_id: event.userId,
      timestamp: new Date().toISOString(),
      hot_reload: true,
    }

    await this.broadcastConfigChange(configChangeEvent)
  }

  /**
   * Broadcast configuration changes to relevant subscribers
   */
  private async broadcastConfigChange(event: ConfigChangeEvent): Promise<void> {
    const relevantConnections = this.getRelevantConnections(event)

    const broadcastPromises = relevantConnections.map(async (connectionId) => {
      try {
        this.sendMessage(connectionId, {
          type: "config_changed",
          ...event,
        })
      } catch (error) {
        console.error(`[WebSocket] Error broadcasting to ${connectionId}:`, error)
      }
    })

    await Promise.all(broadcastPromises)

    // Also broadcast through Redis for cross-server synchronization
    await this.redis.publish("config_changes", JSON.stringify(event))
  }

  /**
   * Get connections that should receive this configuration change
   */
  private getRelevantConnections(event: ConfigChangeEvent): string[] {
    const relevantConnections: string[] = []

    this.connections.forEach((connection, connectionId) => {
      // Check if connection is interested in this change
      if (this.shouldReceiveConfigChange(connection, event)) {
        relevantConnections.push(connectionId)
      }
    })

    return relevantConnections
  }

  /**
   * Determine if a connection should receive a specific config change
   */
  private shouldReceiveConfigChange(
    connection: WebSocketConnection,
    event: ConfigChangeEvent,
  ): boolean {
    // Admin users get all changes
    if (connection.is_admin) return true

    // Tenant-specific changes
    if (event.tenant_id && connection.tenant_id !== event.tenant_id) {
      return false
    }

    // Check subscriptions
    for (const subscriptionKey of connection.subscriptions) {
      if (this.subscriptionMatchesEvent(subscriptionKey, event)) {
        return true
      }
    }

    return false
  }

  /**
   * Check if a subscription matches an event
   */
  private subscriptionMatchesEvent(subscriptionKey: string, event: ConfigChangeEvent): boolean {
    // Parse subscription key to extract filters
    try {
      const filters = JSON.parse(Buffer.from(subscriptionKey, "base64").toString())

      if (filters.event_types && !filters.event_types.includes(event.type)) {
        return false
      }

      if (filters.config_keys && event.key && !filters.config_keys.includes(event.key)) {
        return false
      }

      if (filters.tenant_id && event.tenant_id !== filters.tenant_id) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Auto-subscribe connections to relevant configurations
   */
  private async autoSubscribe(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Subscribe to tenant-specific changes
    if (connection.tenant_id) {
      await this.handleSubscription(connectionId, {
        type: "subscribe",
        filters: {
          tenant_id: connection.tenant_id,
          event_types: ["config_changed", "tenant_updated"],
        },
      })
    }

    // Subscribe admins to system-wide changes
    if (connection.is_admin) {
      await this.handleSubscription(connectionId, {
        type: "subscribe",
        filters: {
          event_types: ["system_alert", "config_changed"],
          categories: ["system", "security", "monitoring"],
        },
      })
    }
  }

  /**
   * Validate authentication token
   */
  private async validateToken(token: string): Promise<any> {
    try {
      const supabase = await createClient()
      const { data: user, error } = await supabase.auth.getUser(token)

      if (error || !user) return null

      // Get user's enterprise info and permissions
      const { data: userDetails } = await supabase
        .from("users")
        .select("*, enterprises(*)")
        .eq("id", user.user.id)
        .single()

      return {
        user_id: user.user.id,
        tenant_id: userDetails?.enterprise_id,
        is_admin:
          userDetails?.role_in_enterprise === "owner" ||
          userDetails?.role_in_enterprise === "admin",
        email: user.user.email,
      }
    } catch (error) {
      console.error("[WebSocket] Token validation error:", error)
      return null
    }
  }

  /**
   * Validate subscription permissions
   */
  private async validateSubscriptionPermissions(
    connection: WebSocketConnection,
    filters: SubscriptionFilter,
  ): Promise<boolean> {
    // Admin users can subscribe to anything
    if (connection.is_admin) return true

    // Users can only subscribe to their own tenant's configurations
    if (filters.tenant_id && filters.tenant_id !== connection.tenant_id) {
      return false
    }

    return true
  }

  /**
   * Validate configuration update permissions
   */
  private async validateConfigUpdatePermissions(
    connection: WebSocketConnection,
    key: string,
  ): Promise<boolean> {
    // Admin users can update most configurations
    if (connection.is_admin) return true

    // Regular users can only update certain configurations
    const allowedKeys = ["user.preferences.*", "notifications.*", "ui.theme.*"]

    return allowedKeys.some((pattern) => key.match(pattern.replace("*", ".*")))
  }

  /**
   * Send message to a specific connection
   */
  private sendMessage(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) return

    try {
      connection.ws.send(
        JSON.stringify({
          ...message,
          timestamp: message.timestamp || new Date().toISOString(),
          server_id: process.env.SERVER_ID || "default",
        }),
      )
    } catch (error) {
      console.error(`[WebSocket] Error sending message to ${connectionId}:`, error)
      this.handleDisconnection(connectionId)
    }
  }

  /**
   * Send error message to a connection
   */
  private sendError(connectionId: string, code: string, message: string): void {
    this.sendMessage(connectionId, {
      type: "error",
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Handle connection disconnection
   */
  private async handleDisconnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Clean up subscriptions
    await this.redis.del(`subscriptions:${connectionId}`)

    this.connections.delete(connectionId)
    console.log(`[WebSocket] Connection ${connectionId} disconnected`)
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(connectionId: string, error: any): void {
    console.error(`[WebSocket] Connection ${connectionId} error:`, error)
    this.handleDisconnection(connectionId)
  }

  /**
   * Handle WebSocket server errors
   */
  private handleServerError(error: any): void {
    console.error("[WebSocket] Server error:", error)
  }

  /**
   * Setup cleanup intervals
   */
  private setupCleanupIntervals(): void {
    // Ping connections every 30 seconds
    this.pingInterval = setInterval(() => {
      this.connections.forEach((connection, connectionId) => {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.ping()
        } else {
          this.handleDisconnection(connectionId)
        }
      })
    }, 30000)

    // Clean up stale connections every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now()
        const staleThreshold = 2 * 60 * 1000 // 2 minutes

        this.connections.forEach((connection, connectionId) => {
          if (now - connection.last_ping.getTime() > staleThreshold) {
            console.log(`[WebSocket] Cleaning up stale connection ${connectionId}`)
            this.handleDisconnection(connectionId)
          }
        })
      },
      5 * 60 * 1000,
    )
  }

  /**
   * Utility methods
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSubscriptionKey(filters: SubscriptionFilter): string {
    return Buffer.from(JSON.stringify(filters)).toString("base64")
  }

  /**
   * Get connection statistics
   */
  public getStats() {
    return {
      total_connections: this.connections.size,
      connections_by_tenant: this.getConnectionsByTenant(),
      admin_connections: Array.from(this.connections.values()).filter((c) => c.is_admin).length,
      total_subscriptions: Array.from(this.connections.values()).reduce(
        (sum, c) => sum + c.subscriptions.size,
        0,
      ),
    }
  }

  private getConnectionsByTenant() {
    const byTenant: Record<string, number> = {}
    this.connections.forEach((connection) => {
      const tenantId = connection.tenant_id || "no-tenant"
      byTenant[tenantId] = (byTenant[tenantId] || 0) + 1
    })
    return byTenant
  }

  /**
   * Shutdown the WebSocket server
   */
  public shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    if (this.wss) {
      this.wss.close()
    }

    this.connections.clear()
    console.log("[WebSocket] Server shutdown completed")
  }
}

// Singleton instance
let websocketInstance: RealTimeConfigWebSocket | null = null

export function getRealTimeConfigWebSocket(): RealTimeConfigWebSocket {
  if (!websocketInstance) {
    websocketInstance = new RealTimeConfigWebSocket()
  }
  return websocketInstance
}

export default RealTimeConfigWebSocket
