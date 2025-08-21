"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Rocket,
  DollarSign,
  Users,
  TrendingUp,
  Globe,
  Target,
  FileText,
  Download,
  Presentation,
  BarChart3,
} from "lucide-react"

export default function YCPitchPage() {
  const [activeTab, setActiveTab] = useState("overview")

  const metrics = {
    tam: "$87B",
    sam: "$12B",
    som: "$120M",
    revenue: "$50K/month",
    growth: "40% MoM",
    users: "2.1K",
  }

  const traction = [
    { metric: "Total Users", value: "2,127", growth: "+142%" },
    { metric: "Monthly Revenue", value: "$52,000", growth: "+40%" },
    { metric: "Bookings", value: "89", growth: "+210%" },
    { metric: "Average Booking Value", value: "$584", growth: "+15%" },
    { metric: "User Retention", value: "73%", growth: "+8%" },
    { metric: "API Partnerships", value: "4", growth: "+300%" },
  ]

  const pitchDeck = [
    { slide: 1, title: "Problem", content: "750M travelers waste 6B hours in airports annually" },
    {
      slide: 2,
      title: "Solution",
      content: "LayoverHQ: Turn wasted time into memorable experiences",
    },
    { slide: 3, title: "Market", content: "$87B travel market, $12B addressable" },
    { slide: 4, title: "Product", content: "AI-powered layover optimization platform" },
    { slide: 5, title: "Traction", content: "2.1K users, $52K MRR, 40% MoM growth" },
    { slide: 6, title: "Business Model", content: "15-20% commission + $50K airline partnerships" },
    { slide: 7, title: "Competition", content: "We're Skiplagged for layovers" },
    { slide: 8, title: "Team", content: "Former Airbnb, Expedia, Google engineers" },
    { slide: 9, title: "Financials", content: "$1.2M ARR by end of year" },
    { slide: 10, title: "Funding", content: "Raising $2M seed for global expansion" },
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Y Combinator Pitch Materials</h1>
            <p className="text-xl text-muted-foreground">LayoverHQ: The Skiplagged for Layovers</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            YC S24 Ready
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Seed Stage
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            $2M Raising
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pitch-deck">Pitch Deck</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.tam}</div>
                <div className="text-sm text-muted-foreground">TAM</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.sam}</div>
                <div className="text-sm text-muted-foreground">SAM</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.som}</div>
                <div className="text-sm text-muted-foreground">SOM</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.revenue}</div>
                <div className="text-sm text-muted-foreground">MRR</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.growth}</div>
                <div className="text-sm text-muted-foreground">Growth</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{metrics.users}</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </CardContent>
            </Card>
          </div>

          {/* Traction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Key Traction Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {traction.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{item.metric}</span>
                      <Badge variant="secondary" className="text-green-600">
                        {item.growth}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{item.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  The Problem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 750M travelers waste 6B hours in airports annually</li>
                  <li>• $200B in lost productivity and entertainment value</li>
                  <li>• Layovers seen as dead time, not opportunities</li>
                  <li>• Complex visa/logistics prevent city exploration</li>
                  <li>• No centralized platform for layover optimization</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Our Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• AI-powered layover optimization platform</li>
                  <li>• Turn wasted time into memorable experiences</li>
                  <li>• Seamless flight + experience bundling</li>
                  <li>• Smart visa/logistics handling</li>
                  <li>• "Skiplagged for layovers" positioning</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pitch-deck" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Presentation className="h-5 w-5" />
                10-Slide Pitch Deck
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pitchDeck.map((slide, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-orange-100 text-orange-800 text-sm font-bold px-2 py-1 rounded">
                        {slide.slide}
                      </div>
                      <h3 className="font-semibold">{slide.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{slide.content}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <Button className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Pitch Deck
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Presentation className="h-4 w-4" />
                  View Full Presentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="font-semibold">Commission Model</div>
                    <div className="text-sm text-muted-foreground">
                      15-20% from experience bookings
                    </div>
                    <div className="text-lg font-bold text-green-600">$52K MRR</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-semibold">Airline Partnerships</div>
                    <div className="text-sm text-muted-foreground">B2B revenue from airlines</div>
                    <div className="text-lg font-bold text-blue-600">$50K/month</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-semibold">Premium Features</div>
                    <div className="text-sm text-muted-foreground">Hacker Mode subscriptions</div>
                    <div className="text-lg font-bold text-purple-600">$15K MRR</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Growth Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Q4 2024</span>
                    <span className="font-bold">$120K MRR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Q2 2025</span>
                    <span className="font-bold">$300K MRR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Q4 2025</span>
                    <span className="font-bold">$800K MRR</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between font-bold">
                      <span>2025 ARR Target</span>
                      <span className="text-green-600">$9.6M</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                YC Application Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-16 flex flex-col items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>YC Application Form</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center gap-2">
                  <Presentation className="h-5 w-5" />
                  <span>Demo Video Script</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Financial Model</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Team Bios</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <span>Market Research</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col items-center gap-2">
                  <Target className="h-5 w-5" />
                  <span>Competitive Analysis</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
