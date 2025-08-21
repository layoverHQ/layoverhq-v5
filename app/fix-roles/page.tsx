"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FixRolesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fixRoles = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      console.log("[v0] Calling fix-admin-roles API...")

      const response = await fetch("/api/fix-admin-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("[v0] Fix roles response:", data)

      setResult(data)
    } catch (error) {
      console.error("[v0] Fix roles error:", error)
      setResult({ error: "Failed to fix roles", details: error })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Fix Admin Roles</CardTitle>
          <CardDescription>Update admin user profiles with correct roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={fixRoles} disabled={isLoading} className="w-full">
            {isLoading ? "Fixing Roles..." : "Fix Admin Roles"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>
              <strong>Admin:</strong> admin@layoverhq.com / LayoverHQ2024!
            </p>
            <p>
              <strong>Manager:</strong> manager@layoverhq.com / Manager2024!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
