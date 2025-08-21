"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plane, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setIsSuccess(true)
    } catch (err: any) {
      console.error("Password reset error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-card/30" />

        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-4">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
              >
                <Plane className="h-6 w-6" />
                <span className="heading-font text-xl">LayoverHQ</span>
              </Link>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-border shadow-lg">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="heading-font text-2xl">Check Your Email</CardTitle>
                  <CardDescription className="body-font">
                    We've sent a password reset link to <strong>{email}</strong>
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="body-font text-sm text-muted-foreground">
                    Click the link in your email to reset your password. The link will expire in 1
                    hour.
                  </p>

                  <div className="space-y-2">
                    <p className="body-font text-xs text-muted-foreground">
                      Didn't receive the email?
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSuccess(false)
                        setEmail("")
                      }}
                      className="border-border bg-transparent"
                    >
                      Try again
                    </Button>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-border">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center text-primary hover:underline body-font text-sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-card/30" />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Plane className="h-6 w-6" />
              <span className="heading-font text-xl">LayoverHQ</span>
            </Link>
          </div>

          {/* Reset Form */}
          <Card className="bg-card/50 backdrop-blur-sm border-border shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="heading-font text-2xl">Reset Password</CardTitle>
                <CardDescription className="body-font">
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="body-font">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription className="body-font">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="text-center pt-4 border-t border-border">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-primary hover:underline body-font text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
