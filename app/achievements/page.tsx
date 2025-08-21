"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Star,
  Crown,
  Target,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Zap,
  Flame,
  Award,
  Medal,
  Shield,
  Rocket,
} from "lucide-react"

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const achievements = [
    {
      id: "first_layover",
      name: "First Steps",
      description: "Complete your first layover experience",
      icon: MapPin,
      rarity: "common",
      progress: 100,
      unlocked: true,
      points: 100,
      category: "milestone",
    },
    {
      id: "savings_master",
      name: "Savings Master",
      description: "Save over $500 using layover hacks",
      icon: DollarSign,
      rarity: "rare",
      progress: 75,
      unlocked: false,
      points: 500,
      category: "savings",
    },
    {
      id: "speed_demon",
      name: "Speed Demon",
      description: "Complete a layover experience in under 3 hours",
      icon: Clock,
      rarity: "epic",
      progress: 90,
      unlocked: false,
      points: 750,
      category: "speed",
    },
    {
      id: "globe_trotter",
      name: "Globe Trotter",
      description: "Visit 10 different layover cities",
      icon: Crown,
      rarity: "legendary",
      progress: 40,
      unlocked: false,
      points: 1000,
      category: "exploration",
    },
    {
      id: "secret_finder",
      name: "Secret Finder",
      description: "Unlock a secret experience vault",
      icon: Shield,
      rarity: "epic",
      progress: 100,
      unlocked: true,
      points: 800,
      category: "secret",
    },
    {
      id: "streak_champion",
      name: "Streak Champion",
      description: "Maintain a 30-day booking streak",
      icon: Flame,
      rarity: "legendary",
      progress: 65,
      unlocked: false,
      points: 1200,
      category: "streak",
    },
  ]

  const leaderboard = [
    { rank: 1, name: "TravelHacker_Pro", score: 12450, avatar: "🥇", streak: 45 },
    { rank: 2, name: "LayoverLegend", score: 11200, avatar: "🥈", streak: 32 },
    { rank: 3, name: "SkiplaggedKing", score: 9800, avatar: "🥉", streak: 28 },
    { rank: 4, name: "AirportNinja", score: 8900, avatar: "🏅", streak: 21 },
    { rank: 5, name: "FlightHacker", score: 8200, avatar: "⭐", streak: 19 },
  ]

  const categories = [
    { name: "Milestone", icon: Target, count: 8, color: "blue" },
    { name: "Savings", icon: DollarSign, count: 12, color: "green" },
    { name: "Speed", icon: Clock, count: 6, color: "orange" },
    { name: "Exploration", icon: MapPin, count: 15, color: "purple" },
    { name: "Secret", icon: Shield, count: 4, color: "red" },
    { name: "Streak", icon: Flame, count: 7, color: "yellow" },
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-600 bg-gray-100"
      case "rare":
        return "text-blue-600 bg-blue-100"
      case "epic":
        return "text-purple-600 bg-purple-100"
      case "legendary":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getIconComponent = (IconComponent: any, unlocked: boolean) => {
    return <IconComponent className={`h-8 w-8 ${unlocked ? "text-yellow-500" : "text-gray-400"}`} />
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-xl">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Achievements & Gamification</h1>
            <p className="text-xl text-muted-foreground">
              Unlock rewards and climb the leaderboard
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Hacker Score: 4,250
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Rank: #23
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Streak: 12 days
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Total Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">4,250</div>
                <div className="text-sm text-muted-foreground">+450 this week</div>
                <Progress value={65} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">8/52</div>
                <div className="text-sm text-muted-foreground">15% complete</div>
                <Progress value={15} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">12 days</div>
                <div className="text-sm text-muted-foreground">Personal best: 28</div>
                <Progress value={43} className="mt-3" />
              </CardContent>
            </Card>
          </div>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Achievement Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((category, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow"
                  >
                    <category.icon className={`h-8 w-8 mx-auto mb-2 text-${category.color}-500`} />
                    <div className="font-semibold">{category.name}</div>
                    <div className="text-sm text-muted-foreground">{category.count} available</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <Card
                key={index}
                className={`${achievement.unlocked ? "bg-yellow-50 border-yellow-200" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${achievement.unlocked ? "bg-yellow-100" : "bg-gray-100"}`}
                    >
                      {getIconComponent(achievement.icon, achievement.unlocked)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        <Badge className={getRarityColor(achievement.rarity)}>
                          {achievement.rarity}
                        </Badge>
                        {achievement.unlocked && <Trophy className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Progress value={achievement.progress} className="w-24" />
                          <span className="text-sm">{achievement.progress}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-semibold">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {achievement.points}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Global Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${index < 3 ? "bg-gradient-to-r from-yellow-50 to-orange-50" : ""}`}
                  >
                    <div className="text-2xl">{user.avatar}</div>
                    <div className="flex-1">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.score} points • {user.streak} day streak
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">#{user.rank}</div>
                      {index < 3 && <Medal className="h-4 w-4 text-yellow-500 inline" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold">23</div>
                  <div className="text-sm text-muted-foreground">Global Rank</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold">4,250</div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold">$1,240</div>
                  <div className="text-sm text-muted-foreground">Total Saved</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">Cities Visited</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Gold Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock premium features and exclusive experiences
                </p>
                <div className="space-y-2 text-sm">
                  <div>• Priority booking support</div>
                  <div>• Exclusive secret experiences</div>
                  <div>• 25% bonus points</div>
                  <div>• Free cancellations</div>
                </div>
                <Button className="w-full mt-4">Unlock (5,000 points)</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Speed Boost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get priority access to limited-time offers
                </p>
                <Button variant="outline" className="w-full">
                  Redeem (1,000 points)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Mystery Box
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Surprise rewards and exclusive experiences
                </p>
                <Button variant="outline" className="w-full">
                  Open (500 points)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
