"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SetupAdminPage() {
  console.log("[v0] SetupAdminPage component loaded")

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showCredentials, setShowCredentials] = useState(false)

  const setupAdminUsers = async () => {
    console.log("[v0] Starting admin user setup")
    setIsLoading(true)
    setMessage("")

    try {
      console.log("[v0] Making API call to /api/setup-admin")
      const response = await fetch("/api/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      console.log("[v0] API response status:", response.status)
      const result = await response.json()
      console.log("[v0] API response data:", result)

      if (result.success) {
        setShowCredentials(true)
        setMessage("Admin users created successfully!")
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] API call failed:", error)
      setMessage(
        `Failed to setup admin users: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">LayoverHQ Admin Setup</CardTitle>
          <CardDescription>Initialize admin users for the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCredentials ? (
            <>
              <Button
                onClick={setupAdminUsers}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Setting up..." : "Setup Admin Users"}
              </Button>

              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Admin users created successfully!
                </AlertDescription>
              </Alert>

              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <div className="text-sm">
                  <strong>Admin:</strong> admin@layoverhq.com / LayoverHQ2024!
                </div>
                <div className="text-sm">
                  <strong>Manager:</strong> manager@layoverhq.com / Manager2024!
                </div>
              </div>

              <Button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Admin Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
