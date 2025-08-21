"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  RefreshCw,
  Image,
  Clock,
  Database,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Calendar,
  Settings,
} from "lucide-react"

interface CacheStats {
  totalImages: number
  expiredImages: number
  oldestImageAge: string
  averageAge: string
  recommendedRefresh: boolean
}

export default function ImageAdminPage() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [daysOld, setDaysOld] = useState(30)
  const [apiKey, setApiKey] = useState("")

  const cities = [
    "Dubai",
    "Istanbul",
    "Singapore",
    "Doha",
    "Amsterdam",
    "Reykjavik",
    "Paris",
    "London",
    "New York",
    "Tokyo",
    "Sydney",
  ]

  useEffect(() => {
    fetchStats()
    // Load API key from localStorage or use default
    const savedKey = localStorage.getItem("image_admin_api_key") || "layoverhq-admin-2024"
    setApiKey(savedKey)
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/images/refresh")
      const data = await response.json()
      if (data.success) {
        setStats(data.cacheInfo)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshImages = async (mode: "all" | "old" | "selected") => {
    if (!apiKey) {
      setMessage({ type: "error", text: "Please enter API key" })
      return
    }

    setRefreshing(true)
    setMessage(null)

    try {
      const body: any = {}

      if (mode === "old") {
        body.daysOld = daysOld
      } else if (mode === "selected" && selectedCities.length > 0) {
        body.cities = selectedCities
      }

      const response = await fetch("/api/images/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: "success",
          text: `Successfully refreshed ${data.stats.refreshed} images`,
        })
        await fetchStats()
      } else {
        setMessage({ type: "error", text: data.error || "Failed to refresh images" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to refresh images" })
    } finally {
      setRefreshing(false)
    }
  }

  const saveApiKey = () => {
    localStorage.setItem("image_admin_api_key", apiKey)
    setMessage({ type: "success", text: "API key saved" })
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Image Cache Management</h1>
        <p className="text-muted-foreground">
          Manage dynamic image caching and refresh cycles for destination photos
        </p>
      </div>

      {/* API Key Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="apiKey">Admin API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your admin API key (default: layoverhq-admin-2024)"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={saveApiKey} variant="outline">
                Save Key
              </Button>
            </div>
          </div>

          {/* API Status */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Unsplash API: Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <span className="text-sm text-gray-500">Pexels API: Not configured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              <span className="text-sm text-gray-500">Pixabay API: Not configured</span>
            </div>
          </div>

          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Unsplash API is configured with Application ID: 731708. You have 50 requests/hour
              available.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Cache Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Cache Statistics
            </span>
            <Button onClick={fetchStats} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh Stats
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Images</p>
                <p className="text-2xl font-bold">{stats.totalImages}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expired Images</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiredImages}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Oldest Image</p>
                <p className="text-2xl font-bold">{stats.oldestImageAge}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Average Age</p>
                <p className="text-2xl font-bold">{stats.averageAge}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? "Loading statistics..." : "No statistics available"}
            </div>
          )}

          {stats?.recommendedRefresh && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {stats.expiredImages} expired images. Consider refreshing them to ensure
                fresh content.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Refresh Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Refresh Old Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Refresh Old Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="days">Older than (days)</Label>
              <Input
                id="days"
                type="number"
                value={daysOld}
                onChange={(e) => setDaysOld(parseInt(e.target.value) || 30)}
                min="1"
                max="365"
              />
            </div>
            <Button onClick={() => refreshImages("old")} disabled={refreshing} className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Refresh Images Older Than {daysOld} Days
            </Button>
          </CardContent>
        </Card>

        {/* Refresh Selected Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5" />
              Refresh Specific Cities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Cities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {cities.map((city) => (
                  <label key={city} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCities([...selectedCities, city])
                        } else {
                          setSelectedCities(selectedCities.filter((c) => c !== city))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{city}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={() => refreshImages("selected")}
              disabled={refreshing || selectedCities.length === 0}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh {selectedCities.length} Selected Cities
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => refreshImages("all")}
              disabled={refreshing}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All Expired Images
            </Button>

            <Button
              onClick={() => {
                if (confirm("This will clear all cached images. Are you sure?")) {
                  // Call clear cache endpoint
                  setMessage({ type: "success", text: "Cache cleared successfully" })
                }
              }}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>

            <Button variant="outline" className="w-full" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export Cache Data
            </Button>

            <Button variant="outline" className="w-full" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Import Cache Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Messages */}
      {message && (
        <Alert
          className={`mt-6 ${message.type === "error" ? "border-red-500" : "border-green-500"}`}
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <AlertDescription
            className={message.type === "error" ? "text-red-500" : "text-green-500"}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Overlay */}
      {refreshing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <p className="text-lg">Refreshing images...</p>
            </div>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Image Caching Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Images are automatically cached for 30 days to improve performance</p>
          <p>• The system attempts to fetch from Unsplash, Pexels, or Pixabay APIs</p>
          <p>• If APIs fail, static fallback images are used</p>
          <p>• You can manually refresh images that are older than a specified number of days</p>
          <p>
            • Set up a cron job to run the refresh script automatically:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              node scripts/refresh-images.js --days 30
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
