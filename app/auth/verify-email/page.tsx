"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plane, Mail, CheckCircle, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    // Check if user is already verified
    const checkVerification = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email_confirmed_at) {
        setIsVerified(true)
        setTimeout(() => {
          router.push("/auth/onboarding")
        }, 2000)
      }
    }

    checkVerification()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        setIsVerified(true)
        setTimeout(() => {
          router.push("/auth/onboarding")
        }, 2000)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage("")

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        setResendMessage("No email found. Please register again.")
        return
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/onboarding`,
        },
      })

      if (error) {
        setResendMessage(error.message)
      } else {
        setResendMessage("Verification email sent! Please check your inbox.")
      }
    } catch (error) {
      setResendMessage("Failed to resend email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="heading-font text-2xl text-foreground">Email Verified!</h2>
              <p className="body-font text-muted-foreground">
                Welcome to LayoverHQ. Redirecting you to complete your profile...
              </p>
            </div>
          </CardContent>
        </Card>
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

          {/* Verification Card */}
          <Card className="bg-card/50 backdrop-blur-sm border-border shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="heading-font text-2xl">Check Your Email</CardTitle>
                <CardDescription className="body-font">
                  We've sent a verification link to your email address. Click the link to activate
                  your account and start optimizing your layovers!
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {resendMessage && (
                <Alert
                  className={
                    resendMessage.includes("sent")
                      ? "border-green-200 bg-green-50"
                      : "border-destructive"
                  }
                >
                  <AlertDescription className="body-font">{resendMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="body-font text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="border-border bg-transparent"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend verification email"
                    )}
                  </Button>
                </div>

                <div className="text-center pt-4 border-t border-border">
                  <p className="body-font text-sm text-muted-foreground">
                    Need help?{" "}
                    <Link href="/support" className="text-primary hover:underline">
                      Contact support
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
