"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Users,
  Star,
  Lock,
  Unlock,
  Award,
  Crown,
  Gem,
  Plane,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Share2,
  Gift,
  Medal,
  Flag,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Achievement {
  id: string
  title: string
  description: string
  icon: any
  points: number
  unlocked: boolean
  progress?: number
  maxProgress?: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface LeaderboardEntry {
  rank: number
  name: string
  avatar: string
  score: number
  layovers: number
  savedAmount: number
  badge: "bronze" | "silver" | "gold" | "platinum"
}

interface UserStats {
  totalLayovers: number
  citiesExplored: number
  totalSaved: number
  averageRating: number
  referrals: number
  currentStreak: number
  bestStreak: number
  nextMilestone: number
}

export function LayoverHackerDashboard() {
  const [hackerScore, setHackerScore] = useState(127)
  const [level, setLevel] = useState(5)
  const [nextLevelProgress, setNextLevelProgress] = useState(65)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalLayovers: 8,
    citiesExplored: 6,
    totalSaved: 1247,
    averageRating: 4.8,
    referrals: 3,
    currentStreak: 3,
    bestStreak: 7,
    nextMilestone: 10,
  })

  useEffect(() => {
    // Initialize achievements
    setAchievements([
      {
        id: "first-escape",
        title: "First Escape",
        description: "Complete your first layover adventure",
        icon: Plane,
        points: 10,
        unlocked: true,
        rarity: "common",
      },
      {
        id: "money-saver",
        title: "Money Saver",
        description: "Save $500 vs airport prices",
        icon: DollarSign,
        points: 25,
        unlocked: true,
        progress: 1247,
        maxProgress: 500,
        rarity: "common",
      },
      {
        id: "world-explorer",
        title: "World Explorer",
        description: "Explore 10 different cities",
        icon: MapPin,
        points: 50,
        unlocked: false,
        progress: 6,
        maxProgress: 10,
        rarity: "rare",
      },
      {
        id: "night-owl",
        title: "Night Owl",
        description: "Book 3 midnight experiences",
        icon: Clock,
        points: 30,
        unlocked: false,
        progress: 1,
        maxProgress: 3,
        rarity: "rare",
      },
      {
        id: "social-hacker",
        title: "Social Hacker",
        description: "Refer 5 friends",
        icon: Users,
        points: 40,
        unlocked: false,
        progress: 3,
        maxProgress: 5,
        rarity: "rare",
      },
      {
        id: "streak-master",
        title: "Streak Master",
        description: "7-day booking streak",
        icon: Zap,
        points: 75,
        unlocked: true,
        rarity: "epic",
      },
      {
        id: "vip-access",
        title: "VIP Access",
        description: "Unlock all secret experiences",
        icon: Crown,
        points: 100,
        unlocked: false,
        progress: 4,
        maxProgress: 10,
        rarity: "legendary",
      },
      {
        id: "arbitrage-king",
        title: "Arbitrage King",
        description: "Save $2000 total",
        icon: Gem,
        points: 150,
        unlocked: false,
        progress: 1247,
        maxProgress: 2000,
        rarity: "legendary",
      },
    ])

    // Initialize leaderboard
    setLeaderboard([
      {
        rank: 1,
        name: "Alex Chen",
        avatar: "/avatar1.jpg",
        score: 2847,
        layovers: 47,
        savedAmount: 8932,
        badge: "platinum",
      },
      {
        rank: 2,
        name: "Sarah Kim",
        avatar: "/avatar2.jpg",
        score: 2341,
        layovers: 38,
        savedAmount: 6234,
        badge: "platinum",
      },
      {
        rank: 3,
        name: "Marcus J.",
        avatar: "/avatar3.jpg",
        score: 1923,
        layovers: 31,
        savedAmount: 5123,
        badge: "gold",
      },
      {
        rank: 4,
        name: "Emma Liu",
        avatar: "/avatar4.jpg",
        score: 1567,
        layovers: 24,
        savedAmount: 4321,
        badge: "gold",
      },
      {
        rank: 5,
        name: "You",
        avatar: "/your-avatar.jpg",
        score: hackerScore,
        layovers: 8,
        savedAmount: 1247,
        badge: "silver",
      },
      {
        rank: 6,
        name: "David Park",
        avatar: "/avatar5.jpg",
        score: 1098,
        layovers: 18,
        savedAmount: 2987,
        badge: "silver",
      },
      {
        rank: 7,
        name: "Lisa Wang",
        avatar: "/avatar6.jpg",
        score: 892,
        layovers: 14,
        savedAmount: 2134,
        badge: "bronze",
      },
    ])
  }, [hackerScore])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-600"
      case "rare":
        return "text-blue-600"
      case "epic":
        return "text-purple-600"
      case "legendary":
        return "text-amber-600"
      default:
        return "text-gray-600"
    }
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "bronze":
        return "bg-orange-100 text-orange-800"
      case "silver":
        return "bg-gray-100 text-gray-800"
      case "gold":
        return "bg-yellow-100 text-yellow-800"
      case "platinum":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLevelTitle = (level: number) => {
    if (level >= 20) return "Layover Legend"
    if (level >= 15) return "Master Hacker"
    if (level >= 10) return "Pro Explorer"
    if (level >= 5) return "Adventure Seeker"
    return "Rookie Escaper"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
          Layover Hacker Dashboard
        </h2>
        <p className="text-muted-foreground">
          Your journey from airport prisoner to layover legend
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hacker Score Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Hacker Score</span>
              <Trophy className="h-5 w-5 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-600 mb-2">{hackerScore}</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Level {level}</span>
                <span className="font-medium">{getLevelTitle(level)}</span>
              </div>
              <Progress value={nextLevelProgress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {100 - nextLevelProgress} points to Level {level + 1}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Saved Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Total Saved</span>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-2">${userStats.totalSaved}</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">vs Airport Prices</span>
                <Badge className="bg-green-100 text-green-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  68%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Avg. ${Math.round(userStats.totalSaved / userStats.totalLayovers)} per layover
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Current Streak</span>
              <Zap className="h-5 w-5 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {userStats.currentStreak} days
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Best Streak</span>
                <span className="font-medium">{userStats.bestStreak} days</span>
              </div>
              <div className="text-xs text-muted-foreground">Book today to continue!</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </span>
            <Badge variant="outline">
              {achievements.filter((a) => a.unlocked).length}/{achievements.length} Unlocked
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "relative p-4 rounded-lg border-2 transition-all",
                    achievement.unlocked
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                      : "bg-gray-50 border-gray-200 opacity-60",
                  )}
                >
                  {/* Rarity Badge */}
                  <div className="absolute top-2 right-2">
                    <Gem className={cn("h-4 w-4", getRarityColor(achievement.rarity))} />
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-2",
                      achievement.unlocked ? "bg-amber-100" : "bg-gray-200",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        achievement.unlocked ? "text-amber-600" : "text-gray-400",
                      )}
                    />
                  </div>

                  {/* Content */}
                  <h4 className="font-medium text-sm mb-1">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>

                  {/* Progress */}
                  {achievement.maxProgress && (
                    <div className="space-y-1">
                      <Progress
                        value={(achievement.progress! / achievement.maxProgress) * 100}
                        className="h-1.5"
                      />
                      <div className="text-xs text-muted-foreground">
                        {achievement.progress}/{achievement.maxProgress}
                      </div>
                    </div>
                  )}

                  {/* Points */}
                  <div className="flex items-center justify-between mt-2">
                    <Badge
                      variant={achievement.unlocked ? "default" : "outline"}
                      className="text-xs"
                    >
                      +{achievement.points} pts
                    </Badge>
                    {achievement.unlocked && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Global Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    entry.name === "You" && "bg-amber-50 border-2 border-amber-200",
                  )}
                >
                  {/* Rank */}
                  <div className="font-bold text-lg w-8">
                    {entry.rank === 1 && "🥇"}
                    {entry.rank === 2 && "🥈"}
                    {entry.rank === 3 && "🥉"}
                    {entry.rank > 3 && `#${entry.rank}`}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatar} />
                    <AvatarFallback>{entry.name[0]}</AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.name}</span>
                      <Badge className={cn("text-xs", getBadgeColor(entry.badge))}>
                        {entry.badge}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.layovers} layovers • ${entry.savedAmount} saved
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="font-bold">{entry.score}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              View Full Leaderboard
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cities Explored</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{userStats.citiesExplored}</span>
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Rating</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{userStats.averageRating}</span>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Friends Referred</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{userStats.referrals}</span>
                  <Users className="h-4 w-4 text-green-600" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Next Milestone</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{userStats.nextMilestone} layovers</span>
                  <Flag className="h-4 w-4 text-purple-600" />
                </div>
              </div>

              {/* Progress to next milestone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Milestone Progress</span>
                  <span>
                    {userStats.totalLayovers}/{userStats.nextMilestone}
                  </span>
                </div>
                <Progress
                  value={(userStats.totalLayovers / userStats.nextMilestone) * 100}
                  className="h-2"
                />
              </div>

              {/* Share Stats */}
              <div className="pt-4 border-t">
                <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Your Stats
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Banner */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Invite Friends, Unlock Secrets</h3>
              <p className="text-purple-100 mb-4">
                Get exclusive access to secret experiences for every 3 friends who book
              </p>
              <Button className="bg-white text-purple-600 hover:bg-purple-50">
                <Gift className="h-4 w-4 mr-2" />
                Get Your Referral Link
              </Button>
            </div>
            <div className="hidden md:block">
              <Users className="h-24 w-24 text-purple-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
