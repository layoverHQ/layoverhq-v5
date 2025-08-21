"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plane, MapPin, Clock, Star, Eye, EyeOff, ArrowRight, ArrowLeft, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface TravelPreferences {
  destinations: string[]
  experienceTypes: string[]
  budgetRange: string
  travelFrequency: string
  layoverDuration: string
}

interface RegistrationData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  preferences: TravelPreferences
  agreeToTerms: boolean
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferences: {
      destinations: [],
      experienceTypes: [],
      budgetRange: "",
      travelFrequency: "",
      layoverDuration: "",
    },
    agreeToTerms: false,
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const popularDestinations = [
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

  const experienceTypes = [
    "City Tours",
    "Cultural Sites",
    "Food & Dining",
    "Shopping",
    "Museums",
    "Architecture",
    "Local Markets",
    "Photography",
    "Adventure",
  ]

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handlePreferenceChange = (field: keyof TravelPreferences, value: any) => {
    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }))
  }

  const toggleDestination = (destination: string) => {
    const current = formData.preferences.destinations
    const updated = current.includes(destination)
      ? current.filter((d) => d !== destination)
      : [...current, destination]
    handlePreferenceChange("destinations", updated)
  }

  const toggleExperience = (experience: string) => {
    const current = formData.preferences.experienceTypes
    const updated = current.includes(experience)
      ? current.filter((e) => e !== experience)
      : [...current, experience]
    handlePreferenceChange("experienceTypes", updated)
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.firstName.trim() !== "" && formData.lastName.trim() !== ""
      case 2:
        return (
          formData.email.trim() !== "" &&
          formData.password.length >= 8 &&
          formData.password === formData.confirmPassword
        )
      case 3:
        return (
          formData.preferences.destinations.length > 0 &&
          formData.preferences.experienceTypes.length > 0
        )
      case 4:
        return formData.agreeToTerms
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/verify`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            display_name: `${formData.firstName} ${formData.lastName}`,
            role: "user",
            travel_preferences: formData.preferences,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        router.push("/auth/verify-email")
      }
    } catch (err: any) {
      console.error("Registration error:", err)
      setError("An error occurred during registration. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="heading-font text-2xl text-foreground">Welcome to LayoverHQ!</h2>
              <p className="body-font text-muted-foreground">
                Let's start with your basic information
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="body-font">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="body-font">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="heading-font text-2xl text-foreground">Account Details</h2>
              <p className="body-font text-muted-foreground">Create your secure account</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="body-font">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="body-font">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="bg-input border-border pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="body-font">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="bg-input border-border pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {formData.password &&
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="heading-font text-2xl text-foreground">Travel Preferences</h2>
              <p className="body-font text-muted-foreground">
                Help us personalize your layover experiences
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="body-font font-medium">Favorite Layover Destinations</Label>
                <div className="flex flex-wrap gap-2">
                  {popularDestinations.map((destination) => (
                    <Badge
                      key={destination}
                      variant={
                        formData.preferences.destinations.includes(destination)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleDestination(destination)}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {destination}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="body-font font-medium">Experience Types</Label>
                <div className="flex flex-wrap gap-2">
                  {experienceTypes.map((experience) => (
                    <Badge
                      key={experience}
                      variant={
                        formData.preferences.experienceTypes.includes(experience)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => toggleExperience(experience)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {experience}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="body-font">Budget Range</Label>
                  <Select
                    value={formData.preferences.budgetRange}
                    onValueChange={(value) => handlePreferenceChange("budgetRange", value)}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget ($0-50)</SelectItem>
                      <SelectItem value="mid-range">Mid-range ($50-150)</SelectItem>
                      <SelectItem value="luxury">Luxury ($150+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="body-font">Travel Frequency</Label>
                  <Select
                    value={formData.preferences.travelFrequency}
                    onValueChange={(value) => handlePreferenceChange("travelFrequency", value)}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="How often?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="occasional">Occasional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="heading-font text-2xl text-foreground">Almost Done!</h2>
              <p className="body-font text-muted-foreground">
                Review your preferences and complete registration
              </p>
            </div>

            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="heading-font text-lg">Your Profile</h3>
                    <p className="body-font text-muted-foreground">
                      {formData.firstName} {formData.lastName} • {formData.email}
                    </p>
                  </div>

                  <div>
                    <h4 className="body-font font-medium">Preferred Destinations</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.preferences.destinations.slice(0, 3).map((dest) => (
                        <Badge key={dest} variant="secondary" className="text-xs">
                          {dest}
                        </Badge>
                      ))}
                      {formData.preferences.destinations.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{formData.preferences.destinations.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="body-font font-medium">Experience Types</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.preferences.experienceTypes.slice(0, 3).map((exp) => (
                        <Badge key={exp} variant="secondary" className="text-xs">
                          {exp}
                        </Badge>
                      ))}
                      {formData.preferences.experienceTypes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{formData.preferences.experienceTypes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked)}
                />
                <Label htmlFor="terms" className="body-font text-sm">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Background */}
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

          {/* Registration Form */}
          <Card className="bg-card/50 backdrop-blur-sm border-border shadow-lg">
            <CardContent className="p-8">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="border-border bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!validateStep(currentStep) || isLoading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      "Creating Account..."
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Login Link */}
          <div className="text-center">
            <p className="body-font text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
