"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Plane,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  Globe,
  Camera,
  Utensils,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const onboardingSteps = [
  {
    id: 1,
    title: "Welcome to LayoverHQ!",
    subtitle: "Turn your layovers into unforgettable experiences",
    content: (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Plane className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-4">
          <h3 className="heading-font text-xl">You're all set!</h3>
          <p className="body-font text-muted-foreground max-w-md mx-auto">
            Your account has been created and verified. Now let's show you how LayoverHQ can
            transform your travel experience.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Smart Layover Optimization",
    subtitle: "We find the perfect flights with optimal layover times",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h4 className="heading-font text-sm">Perfect Timing</h4>
            <p className="body-font text-xs text-muted-foreground">
              4-12 hour layovers optimized for city exploration
            </p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h4 className="heading-font text-sm">Best Locations</h4>
            <p className="body-font text-xs text-muted-foreground">
              Airports with easy city access and great experiences
            </p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h4 className="heading-font text-sm">Curated Experiences</h4>
            <p className="body-font text-xs text-muted-foreground">
              Hand-picked tours and activities for every layover
            </p>
          </div>
        </div>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="body-font text-sm font-medium">Example: London Layover</p>
                <p className="body-font text-xs text-muted-foreground">
                  8-hour layover → 5-hour Westminster & Thames tour → Back with time to spare
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  {
    id: 3,
    title: "Incredible City Experiences",
    subtitle: "Explore world-class destinations during your layovers",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <CardContent className="p-3">
              <h4 className="heading-font text-sm font-medium">Cultural Tours</h4>
              <p className="body-font text-xs text-muted-foreground mt-1">
                Museums, landmarks, and local heritage
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Istanbul
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Dubai
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <CardContent className="p-3">
              <h4 className="heading-font text-sm font-medium">Food Experiences</h4>
              <p className="body-font text-xs text-muted-foreground mt-1">
                Local cuisine and culinary adventures
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Singapore
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Bangkok
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <CardContent className="p-3">
              <h4 className="heading-font text-sm font-medium">Photography Tours</h4>
              <p className="body-font text-xs text-muted-foreground mt-1">
                Capture stunning cityscapes and moments
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Reykjavik
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Doha
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <CardContent className="p-3">
              <h4 className="heading-font text-sm font-medium">City Highlights</h4>
              <p className="body-font text-xs text-muted-foreground mt-1">
                Must-see attractions and hidden gems
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Amsterdam
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Paris
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="body-font text-sm font-medium">All experiences include:</p>
                <p className="body-font text-xs text-muted-foreground">
                  Transportation, expert guides, and guaranteed return to airport
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  {
    id: 4,
    title: "Ready to Explore!",
    subtitle: "Start planning your next layover adventure",
    content: (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div className="space-y-4">
          <h3 className="heading-font text-xl">You're Ready to Go!</h3>
          <p className="body-font text-muted-foreground max-w-md mx-auto">
            Your LayoverHQ account is fully set up. Start searching for flights with amazing layover
            opportunities and turn your travel time into adventure time.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Card className="bg-card border-border p-3 text-center">
              <p className="body-font text-xs text-muted-foreground">Next Flight</p>
              <p className="heading-font text-sm">Search Flights</p>
            </Card>
            <Card className="bg-card border-border p-3 text-center">
              <p className="body-font text-xs text-muted-foreground">Explore</p>
              <p className="heading-font text-sm">City Experiences</p>
            </Card>
          </div>
        </div>
      </div>
    ),
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/register")
        return
      }
      setUser(user)
    }

    getUser()
  }, [router])

  const totalSteps = onboardingSteps.length
  const progress = (currentStep / totalSteps) * 100

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      // Complete onboarding
      router.push("/dashboard")
    }
  }

  const skipOnboarding = () => {
    router.push("/dashboard")
  }

  const currentStepData = onboardingSteps.find((step) => step.id === currentStep)

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="body-font text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-card/30" />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Plane className="h-6 w-6" />
              <span className="heading-font text-xl">LayoverHQ</span>
            </Link>

            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="body-font text-sm">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <Progress value={progress} className="w-full max-w-xs mx-auto" />
            </div>
          </div>

          {/* Onboarding Content */}
          <Card className="bg-card/50 backdrop-blur-sm border-border shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-2 mb-8">
                <h1 className="heading-font text-2xl text-foreground">{currentStepData?.title}</h1>
                <p className="body-font text-muted-foreground">{currentStepData?.subtitle}</p>
              </div>

              {currentStepData?.content}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8">
                <Button
                  variant="ghost"
                  onClick={skipOnboarding}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip tour
                </Button>

                <Button onClick={nextStep} className="bg-primary hover:bg-primary/90">
                  {currentStep === totalSteps ? "Get Started" : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
