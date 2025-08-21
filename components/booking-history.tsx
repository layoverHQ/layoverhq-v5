import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, MapPin, Calendar } from "lucide-react"
import Link from "next/link"

interface BookingHistoryProps {
  userId: string
}

export async function BookingHistory({ userId }: BookingHistoryProps) {
  const supabase = await createClient()

  const { data: pastBookings } = await supabase
    .from("bookings")
    .select(
      `
      *,
      layover_packages (
        id,
        title,
        destination,
        duration_hours,
        price
      )
    `,
    )
    .eq("user_id", userId)
    .lt("departure_date", new Date().toISOString())
    .order("departure_date", { ascending: false })
    .limit(5)

  if (!pastBookings || pastBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Booking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No past bookings yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Booking History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pastBookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900">
                    {booking.origin} → {booking.destination}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {booking.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(booking.departure_date).toLocaleDateString()}
                  </span>
                  {booking.layover_packages && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {booking.layover_packages.destination}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/bookings/${booking.id}`}>View</Link>
              </Button>
            </div>
          ))}
        </div>

        {pastBookings.length >= 5 && (
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard/history">View All History</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
