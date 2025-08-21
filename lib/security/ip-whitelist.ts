import { createClient } from "@/lib/supabase/client"

export interface IPWhitelistEntry {
  id: string
  ipAddress: string
  description: string
  isActive: boolean
  createdBy: string
  createdAt: string
}

export class IPWhitelistManager {
  private supabase = createClient()

  async isIPAllowed(ipAddress: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("ip_whitelist")
        .select("*")
        .eq("ip_address", ipAddress)
        .eq("is_active", true)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("IP whitelist check error:", error)
        return true // Allow access on error to prevent lockout
      }

      return !!data
    } catch (error) {
      console.error("IP whitelist validation error:", error)
      return true // Allow access on error
    }
  }

  async addIP(ipAddress: string, description: string, createdBy: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from("ip_whitelist").insert({
        ip_address: ipAddress,
        description,
        created_by: createdBy,
        is_active: true,
      })

      return !error
    } catch (error) {
      console.error("Add IP whitelist error:", error)
      return false
    }
  }

  async removeIP(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("ip_whitelist")
        .update({ is_active: false })
        .eq("id", id)

      return !error
    } catch (error) {
      console.error("Remove IP whitelist error:", error)
      return false
    }
  }

  async listIPs(): Promise<IPWhitelistEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from("ip_whitelist")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("List IP whitelist error:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("List IP whitelist error:", error)
      return []
    }
  }
}
