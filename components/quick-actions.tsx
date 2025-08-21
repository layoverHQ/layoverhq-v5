import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Settings, CreditCard } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      icon: <Search className="h-4 w-4" />,
      label: "Search Flights",
      href: "/search",
      description: "Find your next layover adventure",
    },
    {
      icon: <MapPin className="h-4 w-4" />,
      label: "Browse Experiences",
      href: "/experiences",
      description: "Discover layover activities",
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: "Profile Settings",
      href: "/dashboard/profile",
      description: "Update your preferences",
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      label: "Payment Methods",
      href: "/dashboard/payments",
      description: "Manage your cards",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => (
            <Button
              key={action.href}
              variant="ghost"
              className="w-full justify-start h-auto p-3"
              asChild
            >
              <Link href={action.href}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{action.icon}</div>
                  <div className="text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-slate-500">{action.description}</div>
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
