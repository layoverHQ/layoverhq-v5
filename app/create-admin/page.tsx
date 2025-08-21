"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function CreateAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const createAdmin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/create-admin", {
        method: "POST",
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: "Failed to create admin user" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Create Admin User</CardTitle>
            <CardDescription>Initialize the admin user for LayoverHQ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createAdmin} disabled={isLoading} className="w-full">
              {isLoading ? "Creating Admin..." : "Create Admin User"}
            </Button>

            {result && (
              <div className="mt-4 p-4 rounded-lg bg-gray-50">
                {result.success ? (
                  <div className="text-green-600">
                    <p className="font-semibold">Admin user created successfully!</p>
                    <p className="text-sm mt-2">
                      Email: {result.credentials.email}
                      <br />
                      Password: {result.credentials.password}
                    </p>
                    <p className="text-sm mt-2 text-gray-600">
                      You can now login at{" "}
                      <a href="/admin" className="underline">
                        /admin
                      </a>
                    </p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <p className="font-semibold">Error:</p>
                    <p className="text-sm">{result.error}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
