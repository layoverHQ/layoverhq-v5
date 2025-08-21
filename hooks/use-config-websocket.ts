"use client"

/**
 * React Hook for WebSocket Configuration Updates
 *
 * Provides real-time configuration updates through WebSocket connection
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "./use-toast"

export interface ConfigUpdateEvent {
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

export interface SubscriptionFilter {
  config_keys?: string[]
  categories?: string[]
  tenant_id?: string
  environment?: string
}

export interface WebSocketConfig {
  enabled: boolean
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

export interface UseConfigWebSocketReturn {
  isConnected: boolean
  isConnecting: boolean
  lastUpdate: ConfigUpdateEvent | null
  subscribe: (filter: SubscriptionFilter) => void
  unsubscribe: (filter: SubscriptionFilter) => void
  getConfig: (key: string, tenantId?: string) => void
  reconnect: () => void
  disconnect: () => void
  connectionStats: {
    connectTime?: Date
    reconnectCount: number
    lastError?: string
  }
}

const DEFAULT_CONFIG: WebSocketConfig = {
  enabled: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
}

export function useConfigWebSocket(
  sessionToken?: string,
  config: Partial<WebSocketConfig> = {},
): UseConfigWebSocketReturn {
  const { toast } = useToast()
  const wsConfig = { ...DEFAULT_CONFIG, ...config }

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<ConfigUpdateEvent | null>(null)
  const [connectionStats, setConnectionStats] = useState({
    reconnectCount: 0,
    lastError: undefined as string | undefined,
    connectTime: undefined as Date | undefined,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionsRef = useRef<Set<string>>(new Set())

  /**
   * Create WebSocket URL
   */
  const createWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host
    const token = encodeURIComponent(sessionToken || "")
    return `${protocol}//${host}/api/admin/config/websocket?token=${token}`
  }, [sessionToken])

  /**
   * Send message to WebSocket
   */
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  /**
   * Handle WebSocket message
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)

        switch (message.type) {
          case "connected":
            setIsConnected(true)
            setIsConnecting(false)
            setConnectionStats((prev) => ({
              ...prev,
              connectTime: new Date(),
              lastError: undefined,
            }))

            // Re-establish subscriptions
            subscriptionsRef.current.forEach((subscription) => {
              sendMessage({
                type: "subscribe",
                filter: JSON.parse(subscription),
              })
            })
            break

          case "config_update":
            setLastUpdate(message as ConfigUpdateEvent)

            // Show toast notification for important updates
            if (message.key && !message.key.includes("ui.")) {
              toast({
                title: "Configuration Updated",
                description: `${message.key} has been updated`,
                duration: 3000,
              })
            }
            break

          case "config_value":
            // Handle real-time config value response
            window.dispatchEvent(
              new CustomEvent("config-value-received", {
                detail: {
                  key: message.key,
                  value: message.value,
                  tenant_id: message.tenant_id,
                  timestamp: message.timestamp,
                },
              }),
            )
            break

          case "cache_refreshed":
            toast({
              title: "Configuration Cache Refreshed",
              description: "All configurations have been refreshed",
              duration: 2000,
            })
            break

          case "server_shutdown":
            toast({
              title: "Server Maintenance",
              description: message.reason || "Server is going down for maintenance",
              variant: "destructive",
            })
            break

          case "pong":
            // Reset heartbeat timeout
            if (heartbeatTimeoutRef.current) {
              clearTimeout(heartbeatTimeoutRef.current)
            }

            heartbeatTimeoutRef.current = setTimeout(() => {
              // Send ping if no pong received
              sendMessage({ type: "ping" })
            }, wsConfig.heartbeatInterval)
            break

          case "error":
            console.error("WebSocket server error:", message)
            toast({
              title: "Configuration Error",
              description: message.message || "An error occurred",
              variant: "destructive",
            })
            break

          default:
            console.log("Unknown WebSocket message type:", message.type)
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    },
    [sendMessage, toast, wsConfig.heartbeatInterval],
  )

  /**
   * Handle WebSocket connection open
   */
  const handleOpen = useCallback(() => {
    console.log("WebSocket connected")
    setIsConnected(true)
    setIsConnecting(false)

    // Start heartbeat
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      sendMessage({ type: "ping" })
    }, wsConfig.heartbeatInterval)

    // Reset reconnect count on successful connection
    setConnectionStats((prev) => ({
      ...prev,
      reconnectCount: 0,
      connectTime: new Date(),
      lastError: undefined,
    }))
  }, [sendMessage, wsConfig.heartbeatInterval])

  /**
   * Handle WebSocket connection close
   */
  const handleClose = useCallback(
    (event: CloseEvent) => {
      console.log("WebSocket disconnected:", event.code, event.reason)
      setIsConnected(false)
      setIsConnecting(false)

      // Clear heartbeat
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current)
        heartbeatTimeoutRef.current = null
      }

      // Attempt reconnection if not a normal close
      if (
        wsConfig.enabled &&
        event.code !== 1000 &&
        connectionStats.reconnectCount < wsConfig.maxReconnectAttempts
      ) {
        setConnectionStats((prev) => ({
          ...prev,
          reconnectCount: prev.reconnectCount + 1,
          lastError: `Connection closed: ${event.reason || "Unknown reason"}`,
        }))

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, wsConfig.reconnectInterval)
      }
    },
    [
      wsConfig.enabled,
      wsConfig.reconnectInterval,
      wsConfig.maxReconnectAttempts,
      connectionStats.reconnectCount,
    ],
  )

  /**
   * Handle WebSocket error
   */
  const handleError = useCallback((event: Event) => {
    console.error("WebSocket error:", event)
    setConnectionStats((prev) => ({
      ...prev,
      lastError: "Connection error occurred",
    }))
  }, [])

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!sessionToken || !wsConfig.enabled) {
      return
    }

    if (
      wsRef.current?.readyState === WebSocket.CONNECTING ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return
    }

    setIsConnecting(true)

    try {
      const ws = new WebSocket(createWebSocketUrl())

      ws.onopen = handleOpen
      ws.onmessage = handleMessage
      ws.onclose = handleClose
      ws.onerror = handleError

      wsRef.current = ws
    } catch (error) {
      console.error("Error creating WebSocket connection:", error)
      setIsConnecting(false)
      setConnectionStats((prev) => ({
        ...prev,
        lastError: error instanceof Error ? error.message : "Connection failed",
      }))
    }
  }, [
    sessionToken,
    wsConfig.enabled,
    createWebSocketUrl,
    handleOpen,
    handleMessage,
    handleClose,
    handleError,
  ])

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Normal closure")
      wsRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  /**
   * Subscribe to configuration changes
   */
  const subscribe = useCallback(
    (filter: SubscriptionFilter) => {
      const filterKey = JSON.stringify(filter)
      subscriptionsRef.current.add(filterKey)

      sendMessage({
        type: "subscribe",
        filter,
      })
    },
    [sendMessage],
  )

  /**
   * Unsubscribe from configuration changes
   */
  const unsubscribe = useCallback(
    (filter: SubscriptionFilter) => {
      const filterKey = JSON.stringify(filter)
      subscriptionsRef.current.delete(filterKey)

      sendMessage({
        type: "unsubscribe",
        filter,
      })
    },
    [sendMessage],
  )

  /**
   * Get configuration value in real-time
   */
  const getConfig = useCallback(
    (key: string, tenantId?: string) => {
      sendMessage({
        type: "get_config",
        key,
        tenant_id: tenantId,
      })
    },
    [sendMessage],
  )

  /**
   * Force reconnect
   */
  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(connect, 1000)
  }, [disconnect, connect])

  // Connect on mount and when session token changes
  useEffect(() => {
    if (sessionToken && wsConfig.enabled) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [sessionToken, wsConfig.enabled, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    isConnecting,
    lastUpdate,
    subscribe,
    unsubscribe,
    getConfig,
    reconnect,
    disconnect,
    connectionStats,
  }
}
