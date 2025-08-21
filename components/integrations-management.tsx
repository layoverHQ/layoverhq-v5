"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plane,
  CreditCard,
  MapPin,
  Building,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  TestTube,
  Zap,
  Globe,
  Key,
} from "lucide-react"

// Integration categories and their services
const integrationCategories = {
  flight: {
    name: "Flight Data Providers",
    icon: Plane,
    services: [
      {
        id: "amadeus",
        name: "Amadeus",
        description: "Global flight search and booking API",
        status: "connected",
        lastSync: "2 minutes ago",
        apiKey: "sk_live_amadeus_***",
        endpoint: "https://api.amadeus.com",
        features: ["Flight Search", "Booking", "Real-time Prices"],
      },
      {
        id: "duffel",
        name: "Duffel",
        description: "Modern flight booking infrastructure",
        status: "connected",
        lastSync: "5 minutes ago",
        apiKey: "duffel_live_***",
        endpoint: "https://api.duffel.com",
        features: ["Flight Search", "Booking", "Seat Selection"],
      },
      {
        id: "kiwi",
        name: "Kiwi.com",
        description: "Multi-city and complex routing",
        status: "warning",
        lastSync: "1 hour ago",
        apiKey: "kiwi_api_***",
        endpoint: "https://api.skypicker.com",
        features: ["Multi-city Routes", "Hidden City", "Flexible Dates"],
      },
    ],
  },
  experiences: {
    name: "Experience Providers",
    icon: MapPin,
    services: [
      {
        id: "getyourguide",
        name: "GetYourGuide",
        description: "Tours and activities booking",
        status: "connected",
        lastSync: "10 minutes ago",
        apiKey: "gyg_partner_***",
        endpoint: "https://api.getyourguide.com",
        features: ["City Tours", "Activities", "Skip-the-line"],
      },
      {
        id: "viator",
        name: "Viator",
        description: "TripAdvisor experiences platform",
        status: "disconnected",
        lastSync: "Never",
        apiKey: "",
        endpoint: "https://api.viator.com",
        features: ["Tours", "Experiences", "Local Guides"],
      },
    ],
  },
  payments: {
    name: "Payment Processors",
    icon: CreditCard,
    services: [
      {
        id: "stripe",
        name: "Stripe",
        description: "Primary payment processor",
        status: "connected",
        lastSync: "1 minute ago",
        apiKey: "sk_live_stripe_***",
        endpoint: "https://api.stripe.com",
        features: ["Cards", "Digital Wallets", "Refunds"],
      },
      {
        id: "paypal",
        name: "PayPal",
        description: "Alternative payment method",
        status: "connected",
        lastSync: "3 minutes ago",
        apiKey: "paypal_client_***",
        endpoint: "https://api.paypal.com",
        features: ["PayPal Checkout", "Express Checkout"],
      },
    ],
  },
  hotels: {
    name: "Hotel Partners",
    icon: Building,
    services: [
      {
        id: "booking",
        name: "Booking.com",
        description: "Hotel booking for layovers",
        status: "connected",
        lastSync: "15 minutes ago",
        apiKey: "booking_affiliate_***",
        endpoint: "https://distribution-xml.booking.com",
        features: ["Hotel Search", "Availability", "Booking"],
      },
      {
        id: "hotels",
        name: "Hotels.com",
        description: "Alternative hotel provider",
        status: "warning",
        lastSync: "2 hours ago",
        apiKey: "hotels_api_***",
        endpoint: "https://api.ean.com",
        features: ["Hotel Search", "Reviews", "Photos"],
      },
    ],
  },
}

export function IntegrationsManagement() {
  const [selectedCategory, setSelectedCategory] = useState("flight")
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [testingService, setTestingService] = useState<string | null>(null)

  const toggleApiKeyVisibility = (serviceId: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }))
  }

  const testConnection = async (serviceId: string) => {
    setTestingService(serviceId)
    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setTestingService(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "disconnected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Warning
          </Badge>
        )
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Integration Management</h2>
          <p className="text-muted-foreground">Manage API connections and third-party services</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Zap className="h-4 w-4 mr-2" />
          Test All Connections
        </Button>
      </div>

      {/* Integration Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(integrationCategories).map(([key, category]) => {
            const Icon = category.icon
            return (
              <TabsTrigger key={key} value={key} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{category.name.split(" ")[0]}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.entries(integrationCategories).map(([categoryKey, category]) => (
          <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <category.icon className="h-5 w-5" />
                  <span>{category.name}</span>
                </CardTitle>
                <CardDescription>
                  Manage {category.name.toLowerCase()} integrations and API connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.services.map((service) => (
                  <Card key={service.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getStatusIcon(service.status)}
                            <h3 className="font-semibold">{service.name}</h3>
                            {getStatusBadge(service.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {service.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">API Endpoint</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <Globe className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm font-mono">{service.endpoint}</span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Last Sync</Label>
                              <p className="text-sm mt-1">{service.lastSync}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <Label className="text-xs text-muted-foreground">API Key</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Key className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-mono">
                                {showApiKeys[service.id]
                                  ? service.apiKey || "Not configured"
                                  : "••••••••••••"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleApiKeyVisibility(service.id)}
                              >
                                {showApiKeys[service.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <Label className="text-xs text-muted-foreground">Features</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {service.features.map((feature) => (
                                <Badge key={feature} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-1" />
                                Configure
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Configure {service.name}</DialogTitle>
                                <DialogDescription>
                                  Update API credentials and settings for {service.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="apiKey">API Key</Label>
                                  <Input
                                    id="apiKey"
                                    type="password"
                                    placeholder="Enter API key"
                                    defaultValue={service.apiKey}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="endpoint">API Endpoint</Label>
                                  <Input
                                    id="endpoint"
                                    placeholder="API endpoint URL"
                                    defaultValue={service.endpoint}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="enabled"
                                    defaultChecked={service.status === "connected"}
                                  />
                                  <Label htmlFor="enabled">Enable this integration</Label>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button>Save Changes</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testConnection(service.id)}
                            disabled={testingService === service.id}
                          >
                            <TestTube className="h-4 w-4 mr-1" />
                            {testingService === service.id ? "Testing..." : "Test"}
                          </Button>
                        </div>
                      </div>

                      {service.status === "warning" && (
                        <Alert className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            This integration has connectivity issues. Last successful sync was{" "}
                            {service.lastSync}.
                          </AlertDescription>
                        </Alert>
                      )}

                      {service.status === "disconnected" && (
                        <Alert variant="destructive" className="mt-4">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            This integration is not configured. Please add API credentials to
                            enable.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
