import { createClient } from "@/lib/supabase/server"
import { cacheManager, CacheKeys } from "./cache-manager"

export interface SessionData {
  id: string
  userId: string
  data: Record<string, any>
  expiresAt: Date
  createdAt: Date
  lastAccessedAt: Date
  ipAddress?: string
  userAgent?: string
  isActive: boolean
}

export interface SessionOptions {
  maxAge?: number // Session duration in milliseconds
  rolling?: boolean // Whether to extend session on each access
  secure?: boolean // Whether to require HTTPS
  httpOnly?: boolean // Whether session is HTTP only
  sameSite?: "strict" | "lax" | "none"
}

export class SessionManager {
  private defaultOptions: SessionOptions = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    rolling: true,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  }

  constructor(private options: SessionOptions = {}) {
    this.options = { ...this.defaultOptions, ...options }
  }

  // Create new session
  async createSession(
    userId: string,
    data: Record<string, any> = {},
    metadata: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<SessionData> {
    try {
      const supabase = await createClient()
      const sessionId = this.generateSessionId()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + (this.options.maxAge || 24 * 60 * 60 * 1000))

      const sessionData: Omit<SessionData, "id"> = {
        userId,
        data,
        expiresAt,
        createdAt: now,
        lastAccessedAt: now,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        isActive: true,
      }

      // Store in database
      const { data: session, error } = await supabase
        .from("user_sessions")
        .insert({
          id: sessionId,
          user_id: userId,
          session_data: data,
          expires_at: expiresAt.toISOString(),
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      const fullSession: SessionData = {
        id: sessionId,
        ...sessionData,
      }

      // Cache session for quick access
      await cacheManager.set(CacheKeys.session(sessionId), fullSession, {
        ttl: this.options.maxAge,
        tags: ["session", `user:${userId}`],
      })

      return fullSession
    } catch (error) {
      console.error("Failed to create session:", error)
      throw error
    }
  }

  // Get session by ID
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      // Try cache first
      const cached = await cacheManager.get<SessionData>(CacheKeys.session(sessionId))
      if (cached) {
        // Check if expired
        if (new Date() > cached.expiresAt) {
          await this.destroySession(sessionId)
          return null
        }

        // Update last accessed time if rolling sessions
        if (this.options.rolling) {
          await this.touchSession(sessionId)
        }

        return cached
      }

      // Fallback to database
      const supabase = await createClient()
      const { data: session, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("is_active", true)
        .single()

      if (error || !session) {
        return null
      }

      // Check if expired
      if (new Date() > new Date(session.expires_at)) {
        await this.destroySession(sessionId)
        return null
      }

      const sessionData: SessionData = {
        id: session.id,
        userId: session.user_id,
        data: session.session_data || {},
        expiresAt: new Date(session.expires_at),
        createdAt: new Date(session.created_at),
        lastAccessedAt: new Date(session.updated_at || session.created_at),
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        isActive: session.is_active,
      }

      // Cache for future requests
      await cacheManager.set(CacheKeys.session(sessionId), sessionData, {
        ttl: this.options.maxAge,
        tags: ["session", `user:${session.user_id}`],
      })

      // Update last accessed time if rolling sessions
      if (this.options.rolling) {
        await this.touchSession(sessionId)
      }

      return sessionData
    } catch (error) {
      console.error("Failed to get session:", error)
      return null
    }
  }

  // Update session data
  async updateSession(sessionId: string, data: Record<string, any>): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) {
        return false
      }

      const updatedData = { ...session.data, ...data }
      const supabase = await createClient()

      const { error } = await supabase
        .from("user_sessions")
        .update({
          session_data: updatedData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)

      if (error) {
        throw error
      }

      // Update cache
      const updatedSession: SessionData = {
        ...session,
        data: updatedData,
        lastAccessedAt: new Date(),
      }

      await cacheManager.set(CacheKeys.session(sessionId), updatedSession, {
        ttl: this.options.maxAge,
        tags: ["session", `user:${session.userId}`],
      })

      return true
    } catch (error) {
      console.error("Failed to update session:", error)
      return false
    }
  }

  // Touch session (update last accessed time)
  async touchSession(sessionId: string): Promise<boolean> {
    try {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + (this.options.maxAge || 24 * 60 * 60 * 1000))

      const supabase = await createClient()
      const { error } = await supabase
        .from("user_sessions")
        .update({
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", sessionId)

      if (error) {
        throw error
      }

      // Update cache
      const session = await cacheManager.get<SessionData>(CacheKeys.session(sessionId))
      if (session) {
        session.expiresAt = expiresAt
        session.lastAccessedAt = now
        await cacheManager.set(CacheKeys.session(sessionId), session, {
          ttl: this.options.maxAge,
          tags: ["session", `user:${session.userId}`],
        })
      }

      return true
    } catch (error) {
      console.error("Failed to touch session:", error)
      return false
    }
  }

  // Destroy session
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      const supabase = await createClient()

      // Deactivate in database
      const { error } = await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)

      if (error) {
        throw error
      }

      // Remove from cache
      await cacheManager.delete(CacheKeys.session(sessionId))

      return true
    } catch (error) {
      console.error("Failed to destroy session:", error)
      return false
    }
  }

  // Destroy all sessions for a user
  async destroyUserSessions(userId: string): Promise<boolean> {
    try {
      const supabase = await createClient()

      // Get all active sessions for user
      const { data: sessions } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)

      // Deactivate all sessions
      const { error } = await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (error) {
        throw error
      }

      // Remove from cache
      for (const session of sessions || []) {
        await cacheManager.delete(CacheKeys.session(session.id))
      }

      // Invalidate user cache
      await cacheManager.invalidateByTags([`user:${userId}`])

      return true
    } catch (error) {
      console.error("Failed to destroy user sessions:", error)
      return false
    }
  }

  // Get all active sessions for a user
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const supabase = await createClient()
      const { data: sessions, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      return (sessions || []).map((session) => ({
        id: session.id,
        userId: session.user_id,
        data: session.session_data || {},
        expiresAt: new Date(session.expires_at),
        createdAt: new Date(session.created_at),
        lastAccessedAt: new Date(session.updated_at || session.created_at),
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        isActive: session.is_active,
      }))
    } catch (error) {
      console.error("Failed to get user sessions:", error)
      return []
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const supabase = await createClient()

      // Get expired sessions
      const { data: expiredSessions } = await supabase
        .from("user_sessions")
        .select("id")
        .lt("expires_at", new Date().toISOString())
        .eq("is_active", true)

      if (!expiredSessions || expiredSessions.length === 0) {
        return 0
      }

      // Deactivate expired sessions
      const { error } = await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .lt("expires_at", new Date().toISOString())

      if (error) {
        throw error
      }

      // Remove from cache
      for (const session of expiredSessions) {
        await cacheManager.delete(CacheKeys.session(session.id))
      }

      return expiredSessions.length
    } catch (error) {
      console.error("Failed to cleanup expired sessions:", error)
      return 0
    }
  }

  // Generate secure session ID
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2, 15)
    const randomPart2 = Math.random().toString(36).substring(2, 15)
    return `sess_${timestamp}_${randomPart}${randomPart2}`
  }

  // Session statistics
  async getSessionStats(): Promise<{
    totalActiveSessions: number
    totalUsers: number
    averageSessionDuration: number
    sessionsCreatedToday: number
  }> {
    try {
      const supabase = await createClient()

      const [activeSessionsResult, usersResult, todaySessionsResult] = await Promise.all([
        supabase
          .from("user_sessions")
          .select("id, created_at, updated_at")
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString()),

        supabase
          .from("user_sessions")
          .select("user_id")
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString()),

        supabase
          .from("user_sessions")
          .select("id")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ])

      const activeSessions = activeSessionsResult.data || []
      const uniqueUsers = new Set((usersResult.data || []).map((s) => s.user_id)).size
      const todaySessions = todaySessionsResult.data?.length || 0

      // Calculate average session duration
      const totalDuration = activeSessions.reduce((sum, session) => {
        const duration =
          new Date(session.updated_at || session.created_at).getTime() -
          new Date(session.created_at).getTime()
        return sum + duration
      }, 0)

      const averageSessionDuration =
        activeSessions.length > 0 ? totalDuration / activeSessions.length : 0

      return {
        totalActiveSessions: activeSessions.length,
        totalUsers: uniqueUsers,
        averageSessionDuration,
        sessionsCreatedToday: todaySessions,
      }
    } catch (error) {
      console.error("Failed to get session stats:", error)
      return {
        totalActiveSessions: 0,
        totalUsers: 0,
        averageSessionDuration: 0,
        sessionsCreatedToday: 0,
      }
    }
  }
}

// Global session manager instance
export const sessionManager = new SessionManager({
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  rolling: true,
})

// Add session key to cache keys
Object.assign(CacheKeys, {
  session: (sessionId: string) => `session:${sessionId}`,
})
