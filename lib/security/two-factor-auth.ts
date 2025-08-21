import { createClient } from "@/lib/supabase/client"
import * as crypto from "crypto"

export interface TwoFactorSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export class TwoFactorAuth {
  private supabase = createClient()

  async setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret key
      const secret = this.generateSecret()

      // Generate backup codes
      const backupCodes = this.generateBackupCodes()

      // Create QR code URL (in real implementation, use a proper QR library)
      const qrCode = `otpauth://totp/LayoverHQ:${userId}?secret=${secret}&issuer=LayoverHQ`

      // Store in database (disabled by default)
      await this.supabase.from("user_2fa").upsert({
        user_id: userId,
        secret,
        backup_codes: backupCodes,
        is_enabled: false,
      })

      return {
        secret,
        qrCode,
        backupCodes,
      }
    } catch (error) {
      console.error("2FA setup error:", error)
      throw new Error("Failed to setup two-factor authentication")
    }
  }

  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Verify the token first
      const isValid = await this.verifyToken(userId, token)

      if (!isValid) {
        return false
      }

      // Enable 2FA
      const { error } = await this.supabase
        .from("user_2fa")
        .update({
          is_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      return !error
    } catch (error) {
      console.error("Enable 2FA error:", error)
      return false
    }
  }

  async disableTwoFactor(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("user_2fa")
        .update({
          is_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      return !error
    } catch (error) {
      console.error("Disable 2FA error:", error)
      return false
    }
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("user_2fa")
        .select("*")
        .eq("user_id", userId)
        .eq("is_enabled", true)
        .single()

      if (error || !data) {
        return false
      }

      // Check if it's a backup code
      if (data.backup_codes && data.backup_codes.includes(token)) {
        // Remove used backup code
        const updatedCodes = data.backup_codes.filter((code: string) => code !== token)
        await this.supabase
          .from("user_2fa")
          .update({
            backup_codes: updatedCodes,
            last_used: new Date().toISOString(),
          })
          .eq("user_id", userId)

        return true
      }

      // In a real implementation, verify TOTP token using the secret
      // For now, simulate verification
      const isValidTOTP = this.verifyTOTP(data.secret, token)

      if (isValidTOTP) {
        await this.supabase
          .from("user_2fa")
          .update({ last_used: new Date().toISOString() })
          .eq("user_id", userId)
      }

      return isValidTOTP
    } catch (error) {
      console.error("Verify 2FA token error:", error)
      return false
    }
  }

  async isEnabled(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("user_2fa")
        .select("is_enabled")
        .eq("user_id", userId)
        .single()

      return !error && data?.is_enabled === true
    } catch (error) {
      console.error("Check 2FA status error:", error)
      return false
    }
  }

  private generateSecret(): string {
    return crypto.randomBytes(20).toString("hex")
  }

  private generateBackupCodes(): string[] {
    const codes = []
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString("hex").toUpperCase())
    }
    return codes
  }

  private verifyTOTP(secret: string, token: string): boolean {
    // In a real implementation, use a proper TOTP library like 'otplib'
    // For demo purposes, accept any 6-digit number
    return /^\d{6}$/.test(token)
  }
}
