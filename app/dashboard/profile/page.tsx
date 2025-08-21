import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { TravelPreferences } from "@/components/travel-preferences"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Settings } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Settings</h1>
          <p className="text-slate-600">Manage your account and travel preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="animate-pulse bg-slate-200 h-64 rounded" />}>
                <ProfileForm />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Travel Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="animate-pulse bg-slate-200 h-64 rounded" />}>
                <TravelPreferences />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
