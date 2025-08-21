import { createClient } from "./supabase/client"

export class AuthSessionManager {
  private static instance: AuthSessionManager
  private supabase = createClient()

  static getInstance(): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager()
    }
    return AuthSessionManager.instance
  }

  async signIn(email: string, password: string, rememberMe = false) {
    console.log("[v0] AuthSessionManager: Signing in user", { email, rememberMe })

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log("[v0] AuthSessionManager: Sign in error", error)
      throw error
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    // Set session persistence based on remember me
    if (rememberMe && typeof window !== "undefined") {
      localStorage.setItem("layoverhq-remember-me", "true")
      // Set longer session timeout for remember me
      localStorage.setItem(
        "layoverhq-session-timeout",
        String(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ) // 30 days
    } else if (typeof window !== "undefined") {
      localStorage.setItem("layoverhq-remember-me", "false")
      // Set shorter session timeout for regular login
      localStorage.setItem("layoverhq-session-timeout", String(Date.now() + 24 * 60 * 60 * 1000)) // 1 day
    }

    console.log("[v0] AuthSessionManager: Sign in successful", { user: data.user?.id })
    return data
  }

  async checkSessionTimeout(): Promise<boolean> {
    if (typeof window === "undefined") return true

    const timeout = localStorage.getItem("layoverhq-session-timeout")
    if (!timeout) return false

    const isExpired = Date.now() > Number.parseInt(timeout)
    if (isExpired) {
      console.log("[v0] AuthSessionManager: Session expired, signing out")
      await this.signOut()
      return false
    }

    return true
  }

  async signOut() {
    console.log("[v0] AuthSessionManager: Signing out user")

    if (typeof window !== "undefined") {
      localStorage.removeItem("layoverhq-remember-me")
      localStorage.removeItem("layoverhq-session-timeout")
    }

    const { error } = await this.supabase.auth.signOut()
    if (error) {
      console.log("[v0] AuthSessionManager: Sign out error", error)
      throw error
    }

    console.log("[v0] AuthSessionManager: Sign out successful")
  }

  async refreshSession() {
    console.log("[v0] AuthSessionManager: Refreshing session")

    const { data, error } = await this.supabase.auth.refreshSession()
    if (error) {
      console.log("[v0] AuthSessionManager: Session refresh error", error)
      return null
    }

    console.log("[v0] AuthSessionManager: Session refreshed successfully")
    return data
  }

  async getCurrentSession() {
    const { data, error } = await this.supabase.auth.getSession()
    if (error) {
      console.log("[v0] AuthSessionManager: Get session error", error)
      return null
    }

    return data.session
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}
