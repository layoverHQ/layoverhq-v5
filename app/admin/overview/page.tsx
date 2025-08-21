"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Rocket,
  Code2,
  Trophy,
  Image,
  DollarSign,
  Users,
  TrendingUp,
  Shield,
  Globe,
  Zap,
  Target,
  Star,
} from "lucide-react"

export default function AdminOverviewPage() {
  const features = [
    {
      name: "Hacker Mode",
      description: "Skiplagged-inspired interface with dark theme, achievements, and gamification",
      icon: Code2,
      status: "live",
      color: "purple",
      link: "/hacker-mode",
      details: [
        "Layover arbitrage calculator",
        "Secret experiences vault",
        "Achievement system with badges",
        "Hacker dashboard with leaderboard",
        "Gamified unlocking mechanisms",
      ],
    },
    {
      name: "Dynamic Image System",
      description: "30-day auto-refresh with Unsplash API integration",
      icon: Image,
      status: "live",
      color: "blue",
      link: "/admin/images",
      details: [
        "Unsplash API integration (731708)",
        "30-day automatic cache refresh",
        "Multi-source fallback (Pexels, Pixabay)",
        "Admin dashboard for manual refresh",
        "Batch processing with concurrency control",
      ],
    },
    {
      name: "YC Pitch Materials",
      description: "Complete Y Combinator application package",
      icon: Rocket,
      status: "ready",
      color: "orange",
      link: "/yc-pitch",
      details: [
        "10-slide pitch deck framework",
        "Market analysis (TAM: $87B, SAM: $12B)",
        "Financial projections ($1.2M ARR)",
        "Business model documentation",
        "Competitive positioning vs Skiplagged",
      ],
    },
    {
      name: "Achievements System",
      description: "Comprehensive gamification and rewards platform",
      icon: Trophy,
      status: "live",
      color: "yellow",
      link: "/achievements",
      details: [
        "52 unique achievements across 6 categories",
        "Global leaderboard system",
        "Point-based reward system",
        "Streak tracking and bonuses",
        "Rarity system (common → legendary)",
      ],
    },
  ]

  const metrics = [
    { label: "Total Features Built", value: "25+", icon: Zap, color: "blue" },
    { label: "API Integrations", value: "6", icon: Globe, color: "green" },
    { label: "YC Readiness", value: "100%", icon: Target, color: "orange" },
    { label: "User Experience", value: "Premium", icon: Star, color: "purple" },
  ]

  const techStack = [
    "Next.js 14 with App Router",
    "React Server Components",
    "TypeScript with strict mode",
    "Tailwind CSS + shadcn/ui",
    "Unsplash API integration",
    "Supabase for backend",
    "Viator API for experiences",
    "Amadeus API for flights",
  ]

  const businessModel = [
    { stream: "Experience Commission", percentage: "15-20%", revenue: "$52K MRR" },
    { stream: "Airline Partnerships", percentage: "B2B", revenue: "$50K/month" },
    { stream: "Premium Features", percentage: "SaaS", revenue: "$15K MRR" },
    { stream: "API Licensing", percentage: "Usage", revenue: "Future" },
  ]

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">LayoverHQ: Complete Platform Overview</h1>
            <p className="text-xl text-muted-foreground">
              The Skiplagged for Layovers - Y Combinator Ready
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Production Ready
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            YC S24 Ready
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            $2M Seed Raising
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <metric.icon className={`h-8 w-8 mx-auto mb-2 text-${metric.color}-500`} />
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Core Features & Innovations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-${feature.color}-100`}>
                    <feature.icon className={`h-5 w-5 text-${feature.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.name}</h3>
                    <Badge
                      variant="secondary"
                      className={
                        feature.status === "live"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }
                    >
                      {feature.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                <ul className="text-xs space-y-1 mb-3">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      {detail}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(feature.link, "_blank")}
                >
                  View Feature
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businessModel.map((stream, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{stream.stream}</div>
                    <div className="text-sm text-muted-foreground">{stream.percentage}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{stream.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-semibold text-green-800">Total MRR: $117K</div>
              <div className="text-sm text-green-600">40% month-over-month growth</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Market Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">$87B</div>
                <div className="text-sm text-muted-foreground">Total Addressable Market</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-purple-600">$12B</div>
                  <div className="text-xs text-muted-foreground">SAM</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">$120M</div>
                  <div className="text-xs text-muted-foreground">SOM</div>
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold text-blue-800">"Skiplagged for Layovers"</div>
                <div className="text-xs text-blue-600">Unique positioning in untapped market</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Stack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Technology Stack & Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {techStack.map((tech, index) => (
              <div key={index} className="p-3 border rounded-lg text-center">
                <div className="text-sm font-medium">{tech}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold mb-2">Platform Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Performance:</strong> Server-side rendering, dynamic imports, image
                optimization
              </div>
              <div>
                <strong>Security:</strong> API key management, secure auth flows, data validation
              </div>
              <div>
                <strong>Scalability:</strong> Modular architecture, API rate limiting, caching
                layers
              </div>
              <div>
                <strong>User Experience:</strong> Responsive design, dark mode, accessibility
                features
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8 flex gap-4 justify-center">
        <Button
          className="bg-gradient-to-r from-purple-500 to-blue-500"
          onClick={() => window.open("/hacker-mode", "_blank")}
        >
          <Code2 className="h-4 w-4 mr-2" />
          Experience Hacker Mode
        </Button>
        <Button variant="outline" onClick={() => window.open("/yc-pitch", "_blank")}>
          <Rocket className="h-4 w-4 mr-2" />
          View YC Materials
        </Button>
        <Button variant="outline" onClick={() => window.open("/admin/images", "_blank")}>
          <Image className="h-4 w-4 mr-2" />
          Manage Images
        </Button>
      </div>
    </div>
  )
}
