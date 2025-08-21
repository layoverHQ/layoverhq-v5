"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Sparkles,
  Timer,
  Users,
  Trophy,
  Zap,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Crown,
  Gem,
  Key,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SecretExperience {
  id: string
  title: string
  city: string
  description: string
  price: number
  originalPrice: number
  savingsPercentage: number
  spotsLeft: number
  expiresIn: number // minutes
  difficulty: "easy" | "medium" | "hard"
  unlockMethod: "code" | "score" | "referral" | "time"
  code?: string
  requiredScore?: number
  isUnlocked: boolean
  views: number
  bookings: number
  rating: number
  exclusive: boolean
  tags: string[]
}

interface SecretExperiencesVaultProps {
  userScore?: number
  referralCount?: number
  className?: string
}

export function SecretExperiencesVault({
  userScore = 0,
  referralCount = 0,
  className,
}: SecretExperiencesVaultProps) {
  const [secretExperiences, setSecretExperiences] = useState<SecretExperience[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [codeInput, setCodeInput] = useState("")
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<Record<string, number>>({})

  useEffect(() => {
    // Initialize secret experiences
    const experiences: SecretExperience[] = [
      {
        id: "secret-1",
        title: "🥷 Midnight Desert Safari with Royal Family Guide",
        city: "Dubai",
        description: "Exclusive access to private desert camp used by UAE royalty",
        price: 89,
        originalPrice: 350,
        savingsPercentage: 75,
        spotsLeft: 3,
        expiresIn: 120,
        difficulty: "hard",
        unlockMethod: "score",
        requiredScore: 100,
        isUnlocked: userScore >= 100,
        views: 1247,
        bookings: 89,
        rating: 4.9,
        exclusive: true,
        tags: ["VIP", "After Dark", "Royal Access"],
      },
      {
        id: "secret-2",
        title: "🍜 Hidden Ramen Master's Private Kitchen",
        city: "Tokyo",
        description: "3-hour layover, Michelin chef's secret spot, only 4 seats",
        price: 45,
        originalPrice: 120,
        savingsPercentage: 63,
        spotsLeft: 2,
        expiresIn: 60,
        difficulty: "medium",
        unlockMethod: "code",
        code: "SKIPLAGGED",
        isUnlocked: false,
        views: 892,
        bookings: 67,
        rating: 5.0,
        exclusive: true,
        tags: ["Foodie", "Hidden Gem", "Michelin"],
      },
      {
        id: "secret-3",
        title: "🚁 Helicopter Tour + Burj Khalifa Sunset",
        city: "Dubai",
        description: "Skip all lines, private helicopter, champagne at the top",
        price: 199,
        originalPrice: 550,
        savingsPercentage: 64,
        spotsLeft: 1,
        expiresIn: 30,
        difficulty: "hard",
        unlockMethod: "referral",
        isUnlocked: referralCount >= 3,
        views: 2341,
        bookings: 156,
        rating: 4.8,
        exclusive: true,
        tags: ["Luxury", "Helicopter", "Sunset"],
      },
      {
        id: "secret-4",
        title: "🏛️ After-Hours Louvre with Art Historian",
        city: "Paris",
        description: "Museum to yourself, secret passages, champagne included",
        price: 129,
        originalPrice: 400,
        savingsPercentage: 68,
        spotsLeft: 5,
        expiresIn: 240,
        difficulty: "medium",
        unlockMethod: "time",
        isUnlocked: new Date().getHours() >= 22 || new Date().getHours() <= 4,
        views: 1823,
        bookings: 134,
        rating: 4.9,
        exclusive: true,
        tags: ["Culture", "After Hours", "VIP"],
      },
      {
        id: "secret-5",
        title: "🏎️ F1 Track Experience with Pro Driver",
        city: "Singapore",
        description: "Drive the actual F1 circuit, professional instruction included",
        price: 299,
        originalPrice: 800,
        savingsPercentage: 63,
        spotsLeft: 2,
        expiresIn: 180,
        difficulty: "hard",
        unlockMethod: "score",
        requiredScore: 200,
        isUnlocked: userScore >= 200,
        views: 3456,
        bookings: 201,
        rating: 5.0,
        exclusive: true,
        tags: ["Adrenaline", "F1", "Exclusive"],
      },
    ]

    setSecretExperiences(experiences)

    // Initialize timers
    const initialTimers: Record<string, number> = {}
    experiences.forEach((exp) => {
      initialTimers[exp.id] = exp.expiresIn * 60 // Convert to seconds
    })
    setTimeLeft(initialTimers)
  }, [userScore, referralCount])

  useEffect(() => {
    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((id) => {
          if (updated[id] > 0) {
            updated[id] -= 1
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleUnlock = (experience: SecretExperience) => {
    if (experience.unlockMethod === "code" && codeInput.toUpperCase() === experience.code) {
      setUnlockedIds((prev) => new Set([...prev, experience.id]))
      setCodeInput("")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-amber-100 text-amber-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isUnlocked = (exp: SecretExperience) => {
    return exp.isUnlocked || unlockedIds.has(exp.id)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Key className="h-8 w-8 text-amber-600" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Secret Experience Vault
          </h2>
        </div>
        <p className="text-muted-foreground">
          Hidden deals the airlines don't advertise. Unlock with codes, score, or timing.
        </p>

        {/* User Stats */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-600" />
            <span className="text-sm">
              <span className="font-semibold">{userScore}</span> Hacker Score
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              <span className="font-semibold">{referralCount}</span> Referrals
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Unlock className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              <span className="font-semibold">
                {unlockedIds.size + secretExperiences.filter((e) => e.isUnlocked).length}
              </span>{" "}
              Unlocked
            </span>
          </div>
        </div>
      </div>

      {/* Secret Experiences Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {secretExperiences.map((experience) => {
          const unlocked = isUnlocked(experience)
          const expired = timeLeft[experience.id] <= 0

          return (
            <Card
              key={experience.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                unlocked ? "hover:shadow-xl" : "opacity-90",
                expired && "opacity-50",
              )}
            >
              {/* Exclusive Badge */}
              {experience.exclusive && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-purple-600 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Exclusive
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="space-y-2">
                  {/* Lock Status */}
                  <div className="flex items-center justify-between">
                    {unlocked ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Unlock className="h-3 w-3 mr-1" />
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                    <Badge className={getDifficultyColor(experience.difficulty)}>
                      {experience.difficulty.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3
                    className={cn(
                      "font-semibold text-lg leading-tight",
                      !unlocked && "blur-sm select-none",
                    )}
                  >
                    {unlocked ? experience.title : "🔒 Secret Experience"}
                  </h3>

                  {/* City & Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {experience.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {experience.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {experience.rating}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Description */}
                <p
                  className={cn(
                    "text-sm text-muted-foreground",
                    !unlocked && "blur-sm select-none",
                  )}
                >
                  {unlocked ? experience.description : "Unlock to reveal this secret experience..."}
                </p>

                {/* Pricing */}
                <div className={cn("flex items-center justify-between", !unlocked && "blur-sm")}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">${experience.price}</span>
                      <span className="text-sm line-through text-muted-foreground">
                        ${experience.originalPrice}
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 mt-1">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {experience.savingsPercentage}% OFF
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      {experience.spotsLeft} spots left
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Timer className="h-3 w-3 inline mr-1" />
                      {formatTime(timeLeft[experience.id] || 0)}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {unlocked && (
                  <div className="flex flex-wrap gap-1">
                    {experience.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Unlock Section */}
                {!unlocked && !expired && (
                  <div className="pt-3 border-t">
                    {experience.unlockMethod === "code" && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Enter secret code to unlock:
                        </p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter code..."
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUnlock(experience)}
                            className="h-8 px-3"
                          >
                            <Key className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-amber-600">Hint: Think like Skiplagged...</p>
                      </div>
                    )}

                    {experience.unlockMethod === "score" && (
                      <div className="text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-600 inline mr-1" />
                        Requires {experience.requiredScore} Hacker Score
                        <div className="text-xs text-muted-foreground mt-1">
                          You have: {userScore} points
                        </div>
                      </div>
                    )}

                    {experience.unlockMethod === "referral" && (
                      <div className="text-sm">
                        <Users className="h-4 w-4 text-blue-600 inline mr-1" />
                        Refer 3 friends to unlock
                        <div className="text-xs text-muted-foreground mt-1">
                          Current referrals: {referralCount}
                        </div>
                      </div>
                    )}

                    {experience.unlockMethod === "time" && (
                      <div className="text-sm">
                        <Clock className="h-4 w-4 text-purple-600 inline mr-1" />
                        Available 10 PM - 4 AM only
                        <div className="text-xs text-muted-foreground mt-1">
                          Night owl exclusive
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Book Button */}
                {unlocked && !expired && (
                  <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Book Secret Experience
                  </Button>
                )}

                {expired && (
                  <div className="text-center text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Expired
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Legend */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          How to Unlock Secret Experiences
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Key className="h-4 w-4 text-gray-600 mt-0.5" />
            <div>
              <div className="font-medium">Secret Codes</div>
              <div className="text-xs text-muted-foreground">Found in community</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Trophy className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <div className="font-medium">Hacker Score</div>
              <div className="text-xs text-muted-foreground">Book to earn points</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium">Referrals</div>
              <div className="text-xs text-muted-foreground">Invite friends</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-purple-600 mt-0.5" />
            <div>
              <div className="font-medium">Time Windows</div>
              <div className="text-xs text-muted-foreground">Night exclusives</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
