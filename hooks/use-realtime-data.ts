"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseRealtimeDataOptions {
  table: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  filter?: string
  onUpdate?: (payload: any) => void
}

export function useRealtimeData<T>({
  table,
  event = "*",
  filter,
  onUpdate,
}: UseRealtimeDataOptions) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from(table).select("*")

      if (filter) {
        // Parse filter string like "status.eq.active"
        const [column, operator, value] = filter.split(".")
        query = query.filter(column, operator, value)
      }

      const { data: fetchedData, error: fetchError } = await query

      if (fetchError) throw fetchError

      setData(fetchedData || [])
    } catch (err) {
      console.error(`[v0] Error fetching ${table}:`, err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [table, filter, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    console.log(`[v0] Setting up real-time subscription for ${table}`)

    let channel: RealtimeChannel

    try {
      channel = supabase
        .channel(`realtime-${table}`)
        .on(
          "postgres_changes" as any,
          {
            event,
            schema: "public",
            table,
            filter,
          },
          (payload: any) => {
            console.log(`[v0] Real-time update for ${table}:`, payload)

            if (onUpdate) {
              onUpdate(payload)
            }

            // Update local data based on event type
            setData((currentData) => {
              const eventType = payload.eventType || payload.type
              switch (eventType) {
                case "INSERT":
                  return [...currentData, payload.new as T]
                case "UPDATE":
                  return currentData.map((item) =>
                    (item as any).id === payload.new?.id ? (payload.new as T) : item,
                  )
                case "DELETE":
                  return currentData.filter((item) => (item as any).id !== payload.old?.id)
                default:
                  // For complex updates, refetch all data
                  fetchData()
                  return currentData
              }
            })
          },
        )
        .subscribe((status) => {
          console.log(`[v0] Real-time subscription status for ${table}:`, status)
        })
    } catch (err) {
      console.error(`[v0] Error setting up real-time subscription for ${table}:`, err)
    }

    return () => {
      if (channel) {
        console.log(`[v0] Cleaning up real-time subscription for ${table}`)
        supabase.removeChannel(channel)
      }
    }
  }, [table, event, filter, onUpdate, supabase, fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Hook for real-time metrics and analytics
export function useRealtimeMetrics() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    avgSessionDuration: 0,
    lastUpdated: new Date(),
  })

  const { data: users } = useRealtimeData<any>({
    table: "profiles",
    onUpdate: () => {
      // Recalculate metrics when users change
      updateMetrics()
    },
  })

  const { data: auditLogs } = useRealtimeData<any>({
    table: "audit_logs",
    onUpdate: () => {
      // Recalculate metrics when activities change
      updateMetrics()
    },
  })

  const updateMetrics = useCallback(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(
      (user) =>
        user.last_sign_in_at &&
        new Date(user.last_sign_in_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
    ).length

    const recentLogs = auditLogs.filter(
      (log) => new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000),
    )

    setMetrics({
      totalUsers,
      activeUsers,
      totalSessions: recentLogs.filter((log) => log.action === "sign_in").length,
      avgSessionDuration: Math.floor(Math.random() * 45 + 15), // Placeholder calculation
      lastUpdated: new Date(),
    })
  }, [users, auditLogs])

  useEffect(() => {
    updateMetrics()
  }, [updateMetrics])

  return metrics
}
