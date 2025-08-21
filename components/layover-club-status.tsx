import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Crown, Star, Gift } from "lucide-react"
import Link from "next/link"

interface LayoverClubStatusProps {
  userId: string
}

export async function LayoverClubStatus({ userId }: LayoverClubStatusProps) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_points, club_tier, total_layover_hours")
    .eq("id", userId)
    .single()

  const clubPoints = profile?.club_points || 0
  const clubTier = profile?.club_tier || "Explorer"
  const totalHours = profile?.total_layover_hours || 0

  // Calculate progress to next tier
  const tierThresholds = {
    Explorer: 0,
    Adventurer: 1000,
    Nomad: 2500,
    Elite: 5000,
  }

  const currentThreshold = tierThresholds[clubTier as keyof typeof tierThresholds] || 0
  const nextTier = Object.entries(tierThresholds).find(
    ([_, threshold]) => threshold > clubPoints,
  )?.[0]
  const nextThreshold = nextTier ? tierThresholds[nextTier as keyof typeof tierThresholds] : 10000
  const progress = nextTier
    ? ((clubPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Elite":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "Nomad":
        return <Star className="h-4 w-4 text-purple-500" />
      case "Adventurer":
        return <Gift className="h-4 w-4 text-blue-500" />
      default:
        return <Star className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getTierIcon(clubTier)}
          LayoverHQ Club
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Current Tier</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {clubTier}
              </Badge>
            </div>
            <div className="text-2xl font-bold">{clubPoints.toLocaleString()} points</div>
          </div>

          {nextTier && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Progress to {nextTier}</span>
                <span className="text-sm text-slate-300">
                  {nextThreshold - clubPoints} points to go
                </span>
              </div>
              <Progress value={progress} className="bg-slate-700" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div className="text-center">
              <div className="text-lg font-semibold">{totalHours}h</div>
              <div className="text-xs text-slate-400">Layover Hours</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">12</div>
              <div className="text-xs text-slate-400">Cities Visited</div>
            </div>
          </div>

          <Button variant="secondary" className="w-full" asChild>
            <Link href="/club">View Benefits</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
