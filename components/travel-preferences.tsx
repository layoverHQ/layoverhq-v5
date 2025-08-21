"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plane, MapPin, DollarSign, Bell, Accessibility } from "lucide-react"

interface TravelPreferencesData {
  preferredDestinations: string[]
  budgetRange: [number, number]
  travelStyle: string
  interests: string[]
  layoverDuration: string
  accessibility: string[]
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

const destinations = [
  "Istanbul",
  "Dubai",
  "Doha",
  "Singapore",
  "Amsterdam",
  "Reykjavik",
  "London",
  "Paris",
  "Tokyo",
  "Bangkok",
]

const interests = [
  "City Tours",
  "Food & Dining",
  "Shopping",
  "Museums",
  "Architecture",
  "Nature",
  "Adventure",
  "Relaxation",
  "Photography",
  "Local Culture",
]

const accessibilityOptions = [
  "Wheelchair Access",
  "Visual Assistance",
  "Hearing Assistance",
  "Mobility Support",
  "Dietary Restrictions",
  "Medical Needs",
]

export function TravelPreferences() {
  const [preferences, setPreferences] = useState<TravelPreferencesData>({
    preferredDestinations: [],
    budgetRange: [50, 500],
    travelStyle: "",
    interests: [],
    layoverDuration: "",
    accessibility: [],
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  })

  const [isLoading, setIsLoading] = useState(false)

  const toggleDestination = (destination: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferredDestinations: prev.preferredDestinations.includes(destination)
        ? prev.preferredDestinations.filter((d) => d !== destination)
        : [...prev.preferredDestinations, destination],
    }))
  }

  const toggleInterest = (interest: string) => {
    setPreferences((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const toggleAccessibility = (option: string) => {
    setPreferences((prev) => ({
      ...prev,
      accessibility: prev.accessibility.includes(option)
        ? prev.accessibility.filter((a) => a !== option)
        : [...prev.accessibility, option],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("[v0] Updating travel preferences:", preferences)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      alert("Travel preferences updated successfully!")
    } catch (error) {
      console.error("[v0] Preferences update error:", error)
      alert("Failed to update preferences. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Preferred Destinations
          </CardTitle>
          <CardDescription>Select your favorite layover destinations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {destinations.map((destination) => (
              <Badge
                key={destination}
                variant={
                  preferences.preferredDestinations.includes(destination) ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => toggleDestination(destination)}
              >
                {destination}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Range
          </CardTitle>
          <CardDescription>
            Set your preferred spending range for layover experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="px-3">
              <Slider
                value={preferences.budgetRange}
                onValueChange={(value) =>
                  setPreferences((prev) => ({ ...prev, budgetRange: value as [number, number] }))
                }
                max={1000}
                min={0}
                step={25}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${preferences.budgetRange[0]}</span>
              <span>${preferences.budgetRange[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Travel Style & Duration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Travel Style</Label>
            <Select
              onValueChange={(value) => setPreferences((prev) => ({ ...prev, travelStyle: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your travel style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget Traveler</SelectItem>
                <SelectItem value="comfort">Comfort Seeker</SelectItem>
                <SelectItem value="luxury">Luxury Traveler</SelectItem>
                <SelectItem value="adventure">Adventure Seeker</SelectItem>
                <SelectItem value="cultural">Cultural Explorer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Minimum Layover Duration</Label>
            <Select
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, layoverDuration: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select minimum layover time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2h">2+ hours</SelectItem>
                <SelectItem value="4h">4+ hours</SelectItem>
                <SelectItem value="6h">6+ hours</SelectItem>
                <SelectItem value="8h">8+ hours</SelectItem>
                <SelectItem value="12h">12+ hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interests</CardTitle>
          <CardDescription>What activities interest you during layovers?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant={preferences.interests.includes(interest) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility Needs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accessibilityOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={preferences.accessibility.includes(option)}
                  onCheckedChange={() => toggleAccessibility(option)}
                />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch
                id="email-notifications"
                checked={preferences.notifications.email}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: checked },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <Switch
                id="sms-notifications"
                checked={preferences.notifications.sms}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: checked },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <Switch
                id="push-notifications"
                checked={preferences.notifications.push}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: checked },
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  )
}
