"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoverArbitrageCalculator } from "@/components/layover-arbitrage-calculator"
import { SecretExperiencesVault } from "@/components/secret-experiences-vault"
import { LayoverHackerDashboard } from "@/components/layover-hacker-dashboard"
import { DynamicRecommendationsSection } from "@/components/dynamic-recommendations-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Zap,
  Lock,
  Unlock,
  TrendingUp,
  DollarSign,
  Trophy,
  Users,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Plane,
  Key,
  Crown,
  Target,
  Gift,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useUserLocation } from "@/hooks/use-user-location"

export default function HackerModePage() {
  const { location } = useUserLocation()
  const [isHackerMode, setIsHackerMode] = useState(true)
  const [userScore] = useState(127)
  const [referralCount] = useState(3)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hacker Mode Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative container mx-auto px-6 py-12">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:text-amber-400">
                <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                Back to Normal Mode
              </Button>
            </Link>

            <div className="flex items-center gap-4">
              <Badge className="bg-amber-600 text-white px-3 py-1">
                <Zap className="h-3 w-3 mr-1" />
                HACKER MODE ACTIVE
              </Badge>
              <Badge variant="outline" className="border-amber-400 text-amber-400">
                <Trophy className="h-3 w-3 mr-1" />
                Score: {userScore}
              </Badge>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="p-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg">
                <Key className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Hacker Mode
              </h1>
            </div>

            <p className="text-xl text-gray-300 mb-4">
              The Skiplagged for Layovers - Turn Airport Prison Time into City Adventures
            </p>

            <p className="text-gray-400 mb-8">
              Discover secret experiences, unlock exclusive deals, and join the community of
              travelers who've cracked the layover code. Save money, gain stories, become a legend.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <DollarSign className="h-6 w-6 text-green-400 mb-2" />
                  <div className="text-2xl font-bold text-white">68%</div>
                  <div className="text-xs text-gray-400">Avg. Savings</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <Users className="h-6 w-6 text-blue-400 mb-2" />
                  <div className="text-2xl font-bold text-white">12.7K</div>
                  <div className="text-xs text-gray-400">Active Hackers</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <MapPin className="h-6 w-6 text-purple-400 mb-2" />
                  <div className="text-2xl font-bold text-white">47</div>
                  <div className="text-xs text-gray-400">Cities Unlocked</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <Lock className="h-6 w-6 text-amber-400 mb-2" />
                  <div className="text-2xl font-bold text-white">23</div>
                  <div className="text-xs text-gray-400">Secret Deals</div>
                </CardContent>
              </Card>
            </div>

            {/* The Manifesto */}
            <Card className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-600/50 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-amber-400 mt-1 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">
                      The Layover Hacker's Manifesto
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Every year, 750 million travelers waste 6 billion hours in airports, spending
                      $180B on overpriced food and duty-free traps. Meanwhile, incredible cities sit
                      20 minutes away, unexplored. We're the hackers who escape. We turn layovers
                      into adventures. We save money while gaining experiences. This is the travel
                      hack airlines don't want you to know - but actually love because we make them
                      money too.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <Tabs defaultValue="arbitrage" className="space-y-8">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto bg-gray-800">
            <TabsTrigger value="arbitrage" className="data-[state=active]:bg-amber-600">
              <DollarSign className="h-4 w-4 mr-2" />
              Arbitrage
            </TabsTrigger>
            <TabsTrigger value="secrets" className="data-[state=active]:bg-amber-600">
              <Lock className="h-4 w-4 mr-2" />
              Secrets
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-amber-600">
              <Trophy className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="deals" className="data-[state=active]:bg-amber-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              Live Deals
            </TabsTrigger>
          </TabsList>

          {/* Arbitrage Tab */}
          <TabsContent value="arbitrage" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Layover Arbitrage Calculator</h2>
              <p className="text-gray-400">
                Discover how much you're overpaying at airports vs exploring the city
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LayoverArbitrageCalculator
                city="Dubai"
                layoverHours={8}
                airportCode="DXB"
                experiencePrice={65}
              />
              <LayoverArbitrageCalculator
                city="Istanbul"
                layoverHours={10}
                airportCode="IST"
                experiencePrice={45}
              />
              <LayoverArbitrageCalculator
                city="Singapore"
                layoverHours={6}
                airportCode="SIN"
                experiencePrice={55}
              />
              <LayoverArbitrageCalculator
                city="Amsterdam"
                layoverHours={7}
                airportCode="AMS"
                experiencePrice={60}
              />
            </div>
          </TabsContent>

          {/* Secrets Tab */}
          <TabsContent value="secrets" className="space-y-8">
            <SecretExperiencesVault userScore={userScore} referralCount={referralCount} />
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <LayoverHackerDashboard />
          </TabsContent>

          {/* Live Deals Tab */}
          <TabsContent value="deals" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Live Layover Deals</h2>
              <p className="text-gray-400">
                Real-time opportunities from {location?.city || "your area"}
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <DynamicRecommendationsSection origin={location?.airportCode || "JFK"} className="" />
            </div>
          </TabsContent>
        </Tabs>

        {/* Community Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-blue-400" />
                Join the Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Connect with 12,000+ layover hackers sharing codes, tips, and adventures.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Join Discord</Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Gift className="h-5 w-5 text-green-400" />
                Refer & Earn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Get $20 credit + unlock secret experiences for every friend who books.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">Get Referral Code</Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Crown className="h-5 w-5 text-purple-400" />
                Go Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">
                Unlock all secrets, priority booking, and exclusive VIP experiences.
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">Upgrade Now</Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-600/50 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Sparkles className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Ready to Hack Your Next Layover?</h3>
              <p className="text-gray-300 mb-6">
                Join thousands of travelers who've discovered the secret to turning dead time into
                adventure time.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                <Plane className="h-5 w-5 mr-2" />
                Start Hacking Layovers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
