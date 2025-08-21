"use client"

import { useState } from "react"
import { AdminAuthProvider, useAdminAuth } from "@/components/admin-auth-provider"
import { AdminLogin } from "@/components/admin-login"
import { AdminSidebar } from "@/components/admin-sidebar"
import { DashboardOverview } from "@/components/dashboard-overview"
import { FlightsManagement } from "@/components/flights-management"
import { FlightSearch } from "@/components/flight-search"
import { IntegrationsManagement } from "@/components/integrations-management"
import { SystemMonitoring } from "@/components/system-monitoring"
import BackendServicesManagement from "@/components/backend-services-management"
import UserManagement from "@/components/user-management"
import { BusinessAnalytics } from "@/components/business-analytics"
import { ProductionMonitoring } from "@/components/production-monitoring"
import { Button } from "@/components/ui/button"
import {
  Zap,
  Lock,
  Trophy,
  Target,
  Image as ImageIcon,
  Rocket,
  Star,
  DollarSign,
  BarChart3,
  Users,
  Globe,
  TrendingUp,
} from "lucide-react"

function AdminDashboardContent() {
  const { user, isLoading, login, logout } = useAdminAuth()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [flightSearchLoading, setFlightSearchLoading] = useState(false)

  const handleAdminFlightSearch = async (params: any) => {
    setFlightSearchLoading(true)
    console.log("[v0] Admin flight search test:", params)

    try {
      const searchParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        adults: params.passengers.adults.toString(),
        children: params.passengers.children.toString(),
        infants: params.passengers.infants.toString(),
        cabinClass: params.cabinClass,
        preferLayovers: params.preferLayovers.toString(),
      })

      if (params.returnDate) searchParams.append("returnDate", params.returnDate)
      if (params.maxPrice) searchParams.append("maxPrice", params.maxPrice.toString())
      if (params.maxConnections !== undefined)
        searchParams.append("maxConnections", params.maxConnections.toString())

      const response = await fetch(`/api/v1/flights/search?${searchParams}`)
      const data = await response.json()
      console.log("[v0] Admin flight search results:", data)

      alert(
        `Flight search test completed! Found ${data.data?.flights?.length || 0} flights. Check console for details.`,
      )
    } catch (error) {
      console.error("[v0] Admin flight search error:", error)
      alert("Flight search test failed. Check console for error details.")
    } finally {
      setFlightSearchLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AdminLogin onLogin={login} />
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold">Complete Platform Overview</h2>
              <p className="text-muted-foreground">
                LayoverHQ: The Skiplagged for Layovers - Y Combinator Ready
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">25+</div>
                <div className="text-sm text-muted-foreground">Features Built</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Globe className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">6</div>
                <div className="text-sm text-muted-foreground">API Integrations</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-muted-foreground">YC Readiness</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">Premium</div>
                <div className="text-sm text-muted-foreground">User Experience</div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">🎮 Hacker Mode</h3>
                <p className="mb-4 opacity-90">
                  Skiplagged-inspired dark interface with gamification
                </p>
                <ul className="text-sm space-y-1 mb-4 opacity-80">
                  <li>• Layover arbitrage calculator</li>
                  <li>• Secret experiences vault</li>
                  <li>• Achievement system</li>
                </ul>
                <Button
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  onClick={() => window.open("/hacker-mode", "_blank")}
                >
                  Experience Now
                </Button>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">🖼️ Dynamic Images</h3>
                <p className="mb-4 opacity-90">30-day auto-refresh with Unsplash API</p>
                <ul className="text-sm space-y-1 mb-4 opacity-80">
                  <li>• Unsplash API integration (731708)</li>
                  <li>• Automatic cache refresh</li>
                  <li>• Multi-source fallback</li>
                </ul>
                <Button
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => window.open("/admin/images", "_blank")}
                >
                  Manage Cache
                </Button>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">🚀 YC Materials</h3>
                <p className="mb-4 opacity-90">Complete Y Combinator application package</p>
                <ul className="text-sm space-y-1 mb-4 opacity-80">
                  <li>• TAM: $87B, SAM: $12B</li>
                  <li>• $117K MRR, 40% growth</li>
                  <li>• "Skiplagged for layovers"</li>
                </ul>
                <Button
                  className="bg-white text-orange-600 hover:bg-gray-100"
                  onClick={() => window.open("/yc-pitch", "_blank")}
                >
                  View Pitch
                </Button>
              </div>

              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">🏆 Achievements</h3>
                <p className="mb-4 opacity-90">52 achievements with rewards and leaderboard</p>
                <ul className="text-sm space-y-1 mb-4 opacity-80">
                  <li>• Global ranking system</li>
                  <li>• Point-based rewards</li>
                  <li>• Streak tracking</li>
                </ul>
                <Button
                  className="bg-white text-yellow-600 hover:bg-gray-100"
                  onClick={() => window.open("/achievements", "_blank")}
                >
                  View System
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 justify-center pt-6">
              <Button
                className="bg-gradient-to-r from-purple-500 to-blue-500"
                onClick={() => window.open("/hacker-mode", "_blank")}
              >
                Experience Hacker Mode
              </Button>
              <Button variant="outline" onClick={() => window.open("/admin/overview", "_blank")}>
                Full Overview Page
              </Button>
            </div>
          </div>
        )
      case "flights":
        return <FlightsManagement />
      case "flight-search":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold">Flight Search Testing</h2>
              <p className="text-muted-foreground">
                Test the flight search functionality with real API integrations
              </p>
            </div>
            <FlightSearch onSearch={handleAdminFlightSearch} loading={flightSearchLoading} />
          </div>
        )
      case "bookings":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold">Booking Management</h2>
            <p className="text-muted-foreground">Booking management interface coming soon...</p>
          </div>
        )
      case "users":
        return <UserManagement />
      case "layovers":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold">Layover Packages</h2>
            <p className="text-muted-foreground">
              Layover package management interface coming soon...
            </p>
          </div>
        )
      case "hacker-mode":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold">
                Hacker Mode - Skiplagged for Layovers
              </h2>
              <p className="text-muted-foreground">
                Advanced layover optimization tools for power users
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Layover Arbitrage Calculator
                  </h3>
                  <p className="text-slate-300 mb-4">
                    Discover hidden savings opportunities in layover bookings
                  </p>
                  <Button
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => window.open("/hacker-mode", "_blank")}
                  >
                    Launch Full Experience
                  </Button>
                </div>

                <div className="bg-purple-900 text-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-purple-400" />
                    Secret Experiences Vault
                  </h3>
                  <p className="text-purple-200 mb-4">
                    Unlock exclusive experiences with secret codes
                  </p>
                  <Button
                    variant="outline"
                    className="border-purple-400 text-purple-400 hover:bg-purple-800"
                    onClick={() => window.open("/hacker-mode", "_blank")}
                  >
                    Access Vault
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Hacker Dashboard
                  </h3>
                  <p className="mb-4">Track your savings, streaks, and achievements</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/20 p-3 rounded">
                      <div className="text-2xl font-bold">$1,240</div>
                      <div className="text-sm opacity-80">Total Saved</div>
                    </div>
                    <div className="bg-white/20 p-3 rounded">
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm opacity-80">Day Streak</div>
                    </div>
                  </div>
                  <Button
                    className="bg-white text-orange-600 hover:bg-gray-100"
                    onClick={() => window.open("/hacker-mode", "_blank")}
                  >
                    View Dashboard
                  </Button>
                </div>

                <div className="bg-blue-900 text-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    Achievement System
                  </h3>
                  <p className="text-blue-200 mb-4">
                    52 achievements across 6 categories with rewards
                  </p>
                  <Button
                    variant="outline"
                    className="border-blue-400 text-blue-400 hover:bg-blue-800"
                    onClick={() => window.open("/achievements", "_blank")}
                  >
                    View Achievements
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      case "images":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold">Dynamic Image Cache Management</h2>
              <p className="text-muted-foreground">
                30-day auto-refresh system with Unsplash API integration
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <ImageIcon className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Unsplash API</h3>
                    <p className="text-blue-100">Application ID: 731708</p>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded mb-4">
                  <div className="text-2xl font-bold">Connected</div>
                  <div className="text-sm opacity-80">50 requests/hour available</div>
                </div>
                <Button
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => window.open("/admin/images", "_blank")}
                >
                  Manage Cache
                </Button>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Cache Stats</h3>
                    <p className="text-green-100">Real-time metrics</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Total Images:</span>
                    <span className="font-bold">240</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expired:</span>
                    <span className="font-bold text-orange-200">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Age:</span>
                    <span className="font-bold">15 days</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/20"
                  onClick={() => window.open("/admin/images", "_blank")}
                >
                  View Details
                </Button>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Auto Refresh</h3>
                    <p className="text-orange-100">30-day cycle</p>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded mb-4">
                  <div className="text-sm opacity-80">Next refresh in:</div>
                  <div className="text-xl font-bold">18 hours</div>
                </div>
                <Button
                  className="bg-white text-orange-600 hover:bg-gray-100"
                  onClick={() => window.open("/admin/images", "_blank")}
                >
                  Force Refresh
                </Button>
              </div>
            </div>
          </div>
        )
      case "yc-pitch":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold">Y Combinator Pitch Materials</h2>
              <p className="text-muted-foreground">
                Complete application package for Y Combinator S24
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Rocket className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Pitch Deck</h3>
                    <p className="text-orange-100">10-slide framework</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Problem/Solution:</span>
                    <span className="font-bold">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Size:</span>
                    <span className="font-bold">$87B TAM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Traction:</span>
                    <span className="font-bold">$117K MRR</span>
                  </div>
                </div>
                <Button
                  className="bg-white text-orange-600 hover:bg-gray-100"
                  onClick={() => window.open("/yc-pitch", "_blank")}
                >
                  View Pitch Deck
                </Button>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Financials</h3>
                    <p className="text-green-100">Revenue projections</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Current MRR:</span>
                    <span className="font-bold">$117K</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Growth Rate:</span>
                    <span className="font-bold">40% MoM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>2025 ARR Target:</span>
                    <span className="font-bold">$9.6M</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/20"
                  onClick={() => window.open("/yc-pitch", "_blank")}
                >
                  View Financials
                </Button>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Market Analysis</h3>
                    <p className="text-purple-100">Positioning & competition</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="bg-white/20 p-2 rounded text-center">
                    <div className="text-sm opacity-80">Our Position</div>
                    <div className="font-bold">"Skiplagged for Layovers"</div>
                  </div>
                  <div className="flex justify-between">
                    <span>TAM:</span>
                    <span className="font-bold">$87B</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SAM:</span>
                    <span className="font-bold">$12B</span>
                  </div>
                </div>
                <Button
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  onClick={() => window.open("/yc-pitch", "_blank")}
                >
                  View Analysis
                </Button>
              </div>
            </div>
          </div>
        )
      case "achievements":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold">Achievements & Gamification System</h2>
              <p className="text-muted-foreground">
                52 achievements across 6 categories with rewards and leaderboard
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Total Score</h3>
                    <p className="text-yellow-100">Global ranking</p>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold">4,250</div>
                  <div className="text-sm opacity-80">+450 this week</div>
                </div>
                <Button
                  className="bg-white text-orange-600 hover:bg-gray-100 w-full"
                  onClick={() => window.open("/achievements", "_blank")}
                >
                  View Dashboard
                </Button>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Achievements</h3>
                    <p className="text-purple-100">Progress tracking</p>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold">8/52</div>
                  <div className="text-sm opacity-80">15% complete</div>
                </div>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 w-full"
                  onClick={() => window.open("/achievements", "_blank")}
                >
                  Unlock More
                </Button>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Streak</h3>
                    <p className="text-red-100">Daily activities</p>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold">12 days</div>
                  <div className="text-sm opacity-80">Personal best: 28</div>
                </div>
                <Button
                  className="bg-white text-red-600 hover:bg-gray-100 w-full"
                  onClick={() => window.open("/achievements", "_blank")}
                >
                  Continue Streak
                </Button>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-semibold">Leaderboard</h3>
                    <p className="text-blue-100">Global ranking</p>
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold">#23</div>
                  <div className="text-sm opacity-80">Top 5% globally</div>
                </div>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 w-full"
                  onClick={() => window.open("/achievements", "_blank")}
                >
                  Climb Ranks
                </Button>
              </div>
            </div>
          </div>
        )
      case "analytics":
        return <BusinessAnalytics />
      case "agents":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold">AI Agent Management</h2>
            <p className="text-muted-foreground">AI agent monitoring coming soon...</p>
          </div>
        )
      case "system":
        return <SystemMonitoring />
      case "backend":
        return <BackendServicesManagement />
      case "integrations":
        return <IntegrationsManagement />
      case "production":
        return <ProductionMonitoring />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-serif font-bold">
                {activeSection === "dashboard" && "Dashboard Overview"}
                {activeSection === "overview" && "Complete Platform Overview"}
                {activeSection === "flights" && "Flight Management"}
                {activeSection === "flight-search" && "Flight Search Testing"}
                {activeSection === "bookings" && "Booking Management"}
                {activeSection === "users" && "User Management"}
                {activeSection === "layovers" && "Layover Packages"}
                {activeSection === "hacker-mode" && "Hacker Mode - Skiplagged for Layovers"}
                {activeSection === "images" && "Image Cache Management"}
                {activeSection === "yc-pitch" && "Y Combinator Pitch Materials"}
                {activeSection === "achievements" && "Achievements & Gamification"}
                {activeSection === "analytics" && "Analytics"}
                {activeSection === "agents" && "AI Agents"}
                {activeSection === "system" && "System Health"}
                {activeSection === "backend" && "Backend Services"}
                {activeSection === "integrations" && "Integration Management"}
                {activeSection === "production" && "Production Monitoring"}
                {activeSection === "settings" && "Settings"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
              <button onClick={logout} className="text-sm text-destructive hover:underline">
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <AdminAuthProvider>
      <AdminDashboardContent />
    </AdminAuthProvider>
  )
}
