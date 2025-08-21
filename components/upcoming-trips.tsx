import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Clock, Plane } from "lucide-react"
import Link from "next/link"

interface UpcomingTripsProps {
  userId: string
}

export async function UpcomingTrips({ userId }: UpcomingTripsProps) {
  const supabase = await createClient()

  const { data: trips } = await supabase
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
    .eq("status", "confirmed")
    .gte("departure_date", new Date().toISOString())
    .order("departure_date", { ascending: true })
    .limit(5)

  if (!trips || trips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Upcoming Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Plane className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No upcoming trips yet</p>
            <Button asChild>
              <Link href="/search">Book Your Next Adventure</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Upcoming Trips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {trip.origin} → {trip.destination}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {new Date(trip.departure_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant={trip.status === "confirmed" ? "default" : "secondary"}>
                  {trip.status}
                </Badge>
              </div>

              {trip.layover_packages && (
                <div className="bg-cyan-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-cyan-600" />
                    <span className="font-medium text-cyan-900">{trip.layover_packages.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-cyan-700">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {trip.layover_packages.duration_hours}h experience
                    </span>
                    <span>${trip.layover_packages.price}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/bookings/${trip.id}`}>View Details</Link>
                </Button>
                {trip.layover_packages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/experiences/${trip.layover_packages.id}`}>Experience Info</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {trips.length >= 5 && (
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link href="/dashboard/trips">View All Trips</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
