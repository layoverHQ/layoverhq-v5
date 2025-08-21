import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard-overview"
import { UpcomingTrips } from "@/components/upcoming-trips"
import { BookingHistory } from "@/components/booking-history"
import { LayoverClubStatus } from "@/components/layover-club-status"
import { QuickActions } from "@/components/quick-actions"

export default async function DashboardPage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back!</h1>
          <p className="text-slate-600">Manage your layover adventures and upcoming trips</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<div className="animate-pulse bg-white rounded-xl h-64" />}>
              <DashboardOverview />
            </Suspense>

            <Suspense fallback={<div className="animate-pulse bg-white rounded-xl h-96" />}>
              <UpcomingTrips userId={user.id} />
            </Suspense>

            <Suspense fallback={<div className="animate-pulse bg-white rounded-xl h-96" />}>
              <BookingHistory userId={user.id} />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Suspense fallback={<div className="animate-pulse bg-white rounded-xl h-48" />}>
              <LayoverClubStatus userId={user.id} />
            </Suspense>

            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
