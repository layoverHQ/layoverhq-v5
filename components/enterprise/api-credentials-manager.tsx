/**
 * API Credentials Manager - Enterprise API Key Management
 *
 * Comprehensive interface for managing API credentials with automated generation,
 * permission management, rate limiting, and usage tracking.
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Key,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Activity,
  Shield,
  Clock,
  Settings,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Download,
  RefreshCw,
} from "lucide-react"

interface ApiCredential {
  id: string
  tenant_id: string
  tenant_name: string
  name: string
  description?: string
  api_key_hash: string
  api_key_preview: string // Last 4 characters
  permissions: string[]
  rate_limits: {
    requests_per_minute: number
    requests_per_hour: number
    requests_per_day: number
    burst_capacity: number
  }
  usage_quotas: {
    monthly_requests: number
    monthly_bandwidth_gb: number
  }
  current_usage: {
    requests_this_month: number
    bandwidth_this_month_gb: number
    last_request_at?: string
  }
  ip_whitelist?: string[]
  allowed_origins?: string[]
  expires_at?: string
  is_active: boolean
  created_at: string
  created_by: string
  last_used_at?: string
}

interface CreateCredentialRequest {
  tenant_id: string
  name: string
  description?: string
  permissions: string[]
  rate_limits?: {
    requests_per_minute: number
    requests_per_hour: number
    requests_per_day: number
    burst_capacity: number
  }
  usage_quotas?: {
    monthly_requests: number
    monthly_bandwidth_gb: number
  }
  ip_whitelist?: string[]
  allowed_origins?: string[]
  expires_at?: string
}

interface UsageAnalytics {
  hourly_usage: Array<{ hour: string; requests: number }>
  endpoint_usage: Array<{ endpoint: string; count: number; avg_response_time: number }>
  status_codes: Record<string, number>
  geographic_distribution: Array<{ country: string; requests: number }>
}

const availablePermissions = [
  { id: "*", name: "Full Access", description: "Complete access to all APIs" },
  { id: "flights:*", name: "Flight APIs", description: "All flight-related endpoints" },
  { id: "flights:search", name: "Flight Search", description: "Search for flights only" },
  { id: "experiences:*", name: "Experience APIs", description: "All experience-related endpoints" },
  {
    id: "experiences:search",
    name: "Experience Search",
    description: "Search for experiences only",
  },
  { id: "layovers:*", name: "Layover APIs", description: "All layover-related endpoints" },
  {
    id: "layovers:discover",
    name: "Layover Discovery",
    description: "Discover layover opportunities",
  },
  { id: "bookings:*", name: "Booking APIs", description: "All booking-related endpoints" },
  { id: "bookings:create", name: "Create Bookings", description: "Create new bookings only" },
  { id: "analytics:read", name: "Analytics Read", description: "Read analytics data" },
  { id: "users:read", name: "User Data Read", description: "Read user information" },
]

export default function ApiCredentialsManager() {
  const [credentials, setCredentials] = useState<ApiCredential[]>([])
  const [selectedCredential, setSelectedCredential] = useState<ApiCredential | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState<string>("")
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [createData, setCreateData] = useState<CreateCredentialRequest>({
    tenant_id: "",
    name: "",
    description: "",
    permissions: [],
    ip_whitelist: [],
    allowed_origins: [],
  })

  useEffect(() => {
    loadCredentials()
  }, [])

  useEffect(() => {
    if (selectedCredential) {
      loadAnalytics(selectedCredential.id)
    }
  }, [selectedCredential])

  const loadCredentials = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/api-credentials")
      if (response.ok) {
        const data = await response.json()
        setCredentials(data.credentials || [])
      }
    } catch (error) {
      console.error("Failed to load API credentials:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalytics = async (credentialId: string) => {
    try {
      const response = await fetch(`/api/admin/api-credentials/${credentialId}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error("Failed to load analytics:", error)
    }
  }

  const createCredential = async () => {
    try {
      const response = await fetch("/api/admin/api-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setNewApiKey(result.api_key)
          setShowApiKey(result.credential.id)
          await loadCredentials()
          setShowCreateDialog(false)
          resetCreateData()
        }
      }
    } catch (error) {
      console.error("Error creating API credential:", error)
    }
  }

  const updateCredential = async (credentialId: string, updates: Partial<ApiCredential>) => {
    try {
      const response = await fetch(`/api/admin/api-credentials/${credentialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await loadCredentials()
      }
    } catch (error) {
      console.error("Error updating credential:", error)
    }
  }

  const regenerateApiKey = async (credentialId: string) => {
    if (
      !confirm(
        "Are you sure you want to regenerate this API key? The old key will stop working immediately.",
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/api-credentials/${credentialId}/regenerate`, {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        setNewApiKey(result.api_key)
        setShowApiKey(credentialId)
        await loadCredentials()
      }
    } catch (error) {
      console.error("Error regenerating API key:", error)
    }
  }

  const deleteCredential = async (credentialId: string) => {
    if (
      !confirm("Are you sure you want to delete this API credential? This action cannot be undone.")
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/api-credentials/${credentialId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadCredentials()
        if (selectedCredential?.id === credentialId) {
          setSelectedCredential(null)
        }
      }
    } catch (error) {
      console.error("Error deleting credential:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const resetCreateData = () => {
    setCreateData({
      tenant_id: "",
      name: "",
      description: "",
      permissions: [],
      ip_whitelist: [],
      allowed_origins: [],
    })
  }

  const getUsagePercentage = (current: number, quota: number) => {
    return quota > 0 ? Math.min((current / quota) * 100, 100) : 0
  }

  const getStatusColor = (credential: ApiCredential) => {
    if (!credential.is_active) return "bg-gray-100 text-gray-800"
    if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
      return "bg-red-100 text-red-800"
    }

    // Check if approaching rate limits
    const requestUsage = getUsagePercentage(
      credential.current_usage.requests_this_month,
      credential.usage_quotas.monthly_requests,
    )

    if (requestUsage > 90) return "bg-red-100 text-red-800"
    if (requestUsage > 75) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getStatusText = (credential: ApiCredential) => {
    if (!credential.is_active) return "Inactive"
    if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
      return "Expired"
    }
    return "Active"
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading API credentials...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Credentials Management</CardTitle>
              <CardDescription>
                Manage API keys, permissions, rate limits, and monitor usage across all enterprise
                tenants.
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New API Credential</DialogTitle>
                  <DialogDescription>
                    Set up a new API key with specific permissions and rate limits.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={createData.name}
                        onChange={(e) =>
                          setCreateData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Production API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenant">Tenant</Label>
                      <Select
                        value={createData.tenant_id}
                        onValueChange={(value) =>
                          setCreateData((prev) => ({
                            ...prev,
                            tenant_id: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* This would be populated with actual tenants */}
                          <SelectItem value="tenant1">Airline Corp</SelectItem>
                          <SelectItem value="tenant2">Travel Express</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createData.description}
                      onChange={(e) =>
                        setCreateData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Brief description of this API key's purpose"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availablePermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <h4 className="font-medium">{permission.name}</h4>
                            <p className="text-sm text-gray-600">{permission.description}</p>
                          </div>
                          <Switch
                            checked={createData.permissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCreateData((prev) => ({
                                  ...prev,
                                  permissions: [...prev.permissions, permission.id],
                                }))
                              } else {
                                setCreateData((prev) => ({
                                  ...prev,
                                  permissions: prev.permissions.filter((p) => p !== permission.id),
                                }))
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>IP Whitelist (Optional)</Label>
                    <Textarea
                      value={createData.ip_whitelist?.join("\n") || ""}
                      onChange={(e) =>
                        setCreateData((prev) => ({
                          ...prev,
                          ip_whitelist: e.target.value.split("\n").filter((ip) => ip.trim()),
                        }))
                      }
                      placeholder="192.168.1.1&#10;10.0.0.0/8&#10;0.0.0.0/0 (for all IPs)"
                      rows={3}
                    />
                    <p className="text-sm text-gray-500">
                      Enter one IP address or CIDR block per line. Leave empty to allow all IPs.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Allowed Origins (Optional)</Label>
                    <Textarea
                      value={createData.allowed_origins?.join("\n") || ""}
                      onChange={(e) =>
                        setCreateData((prev) => ({
                          ...prev,
                          allowed_origins: e.target.value
                            .split("\n")
                            .filter((origin) => origin.trim()),
                        }))
                      }
                      placeholder="https://example.com&#10;https://app.example.com&#10;* (for all origins)"
                      rows={3}
                    />
                    <p className="text-sm text-gray-500">
                      Enter one origin per line. Leave empty to allow all origins.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createCredential}
                    disabled={
                      !createData.name ||
                      !createData.tenant_id ||
                      createData.permissions.length === 0
                    }
                  >
                    Create API Key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* API Key Display Dialog */}
      <Dialog open={!!showApiKey} onOpenChange={() => setShowApiKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogDescription>
              Please copy this API key now. You won't be able to see it again for security reasons.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Your new API key:</p>
                  <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                    {newApiKey}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newApiKey)}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credentials List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCredential?.id === credential.id
                      ? "border-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCredential(credential)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{credential.name}</h3>
                    <Badge className={getStatusColor(credential)}>
                      {getStatusText(credential)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{credential.tenant_name}</p>
                  <div className="text-xs text-gray-500">Key: •••{credential.api_key_preview}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {credential.current_usage.requests_this_month.toLocaleString()} requests
                    </span>
                    <span className="text-xs text-gray-500">
                      {credential.permissions.length} permissions
                    </span>
                  </div>
                </div>
              ))}

              {credentials.length === 0 && (
                <div className="text-center py-8 text-gray-500">No API credentials found.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Credential Details */}
        <div className="lg:col-span-2">
          {selectedCredential ? (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="limits">Rate Limits</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedCredential.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateApiKey(selectedCredential.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteCredential(selectedCredential.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{selectedCredential.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Tenant</Label>
                        <p className="font-medium">{selectedCredential.tenant_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Status</Label>
                        <Badge className={getStatusColor(selectedCredential)}>
                          {getStatusText(selectedCredential)}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Created</Label>
                        <p className="text-sm">
                          {new Date(selectedCredential.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Last Used</Label>
                        <p className="text-sm">
                          {selectedCredential.last_used_at
                            ? new Date(selectedCredential.last_used_at).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm">Monthly Requests</Label>
                          <span className="text-sm text-gray-500">
                            {selectedCredential.current_usage.requests_this_month.toLocaleString()}{" "}
                            / {selectedCredential.usage_quotas.monthly_requests.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={getUsagePercentage(
                            selectedCredential.current_usage.requests_this_month,
                            selectedCredential.usage_quotas.monthly_requests,
                          )}
                          className="h-2"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm">Monthly Bandwidth</Label>
                          <span className="text-sm text-gray-500">
                            {selectedCredential.current_usage.bandwidth_this_month_gb.toFixed(2)} GB
                            / {selectedCredential.usage_quotas.monthly_bandwidth_gb} GB
                          </span>
                        </div>
                        <Progress
                          value={getUsagePercentage(
                            selectedCredential.current_usage.bandwidth_this_month_gb,
                            selectedCredential.usage_quotas.monthly_bandwidth_gb,
                          )}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Permissions</CardTitle>
                    <CardDescription>
                      Endpoints and operations this API key can access.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedCredential.permissions.map((permission) => {
                        const permissionInfo = availablePermissions.find((p) => p.id === permission)
                        return (
                          <div
                            key={permission}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div>
                              <h4 className="font-medium">{permissionInfo?.name || permission}</h4>
                              <p className="text-sm text-gray-600">
                                {permissionInfo?.description || "Custom permission"}
                              </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="limits" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rate Limits</CardTitle>
                    <CardDescription>
                      Request rate limiting configuration for this API key.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded">
                        <h3 className="font-medium mb-2">Per Minute</h3>
                        <p className="text-2xl font-bold">
                          {selectedCredential.rate_limits.requests_per_minute}
                        </p>
                        <p className="text-sm text-gray-600">requests</p>
                      </div>
                      <div className="p-4 border rounded">
                        <h3 className="font-medium mb-2">Per Hour</h3>
                        <p className="text-2xl font-bold">
                          {selectedCredential.rate_limits.requests_per_hour}
                        </p>
                        <p className="text-sm text-gray-600">requests</p>
                      </div>
                      <div className="p-4 border rounded">
                        <h3 className="font-medium mb-2">Per Day</h3>
                        <p className="text-2xl font-bold">
                          {selectedCredential.rate_limits.requests_per_day}
                        </p>
                        <p className="text-sm text-gray-600">requests</p>
                      </div>
                      <div className="p-4 border rounded">
                        <h3 className="font-medium mb-2">Burst Capacity</h3>
                        <p className="text-2xl font-bold">
                          {selectedCredential.rate_limits.burst_capacity}
                        </p>
                        <p className="text-sm text-gray-600">requests</p>
                      </div>
                    </div>

                    {selectedCredential.ip_whitelist &&
                      selectedCredential.ip_whitelist.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-medium mb-2">IP Whitelist</h3>
                          <div className="space-y-1">
                            {selectedCredential.ip_whitelist.map((ip, index) => (
                              <Badge key={index} variant="outline">
                                {ip}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedCredential.allowed_origins &&
                      selectedCredential.allowed_origins.length > 0 && (
                        <div className="mt-6">
                          <h3 className="font-medium mb-2">Allowed Origins</h3>
                          <div className="space-y-1">
                            {selectedCredential.allowed_origins.map((origin, index) => (
                              <Badge key={index} variant="outline">
                                {origin}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Analytics</CardTitle>
                    <CardDescription>
                      Detailed usage statistics and performance metrics.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border rounded">
                            <h3 className="font-medium mb-2">Total Requests</h3>
                            <p className="text-2xl font-bold">
                              {analytics.hourly_usage
                                .reduce((sum, hour) => sum + hour.requests, 0)
                                .toLocaleString()}
                            </p>
                          </div>
                          <div className="p-4 border rounded">
                            <h3 className="font-medium mb-2">Avg Response Time</h3>
                            <p className="text-2xl font-bold">
                              {analytics.endpoint_usage.length > 0
                                ? Math.round(
                                    analytics.endpoint_usage.reduce(
                                      (sum, ep) => sum + ep.avg_response_time,
                                      0,
                                    ) / analytics.endpoint_usage.length,
                                  )
                                : 0}
                              ms
                            </p>
                          </div>
                          <div className="p-4 border rounded">
                            <h3 className="font-medium mb-2">Success Rate</h3>
                            <p className="text-2xl font-bold">
                              {Object.entries(analytics.status_codes).length > 0
                                ? Math.round(
                                    ((analytics.status_codes["200"] || 0) /
                                      Object.values(analytics.status_codes).reduce(
                                        (a, b) => a + b,
                                        0,
                                      )) *
                                      100,
                                  )
                                : 0}
                              %
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-3">Top Endpoints</h3>
                          <div className="space-y-2">
                            {analytics.endpoint_usage.slice(0, 5).map((endpoint, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 border rounded"
                              >
                                <span className="font-mono text-sm">{endpoint.endpoint}</span>
                                <div className="text-right">
                                  <span className="font-medium">
                                    {endpoint.count.toLocaleString()}
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    {endpoint.avg_response_time.toFixed(0)}ms avg
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No analytics data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Key Settings</CardTitle>
                    <CardDescription>Manage API key status and configuration.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Active Status</Label>
                        <p className="text-sm text-gray-600">Enable or disable this API key</p>
                      </div>
                      <Switch
                        checked={selectedCredential.is_active}
                        onCheckedChange={(checked) =>
                          updateCredential(selectedCredential.id, { is_active: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Expiration Date (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={
                          selectedCredential.expires_at
                            ? new Date(selectedCredential.expires_at).toISOString().slice(0, 16)
                            : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value
                            ? new Date(e.target.value).toISOString()
                            : undefined
                          updateCredential(selectedCredential.id, { expires_at: value })
                        }}
                      />
                      <p className="text-sm text-gray-500">Leave empty for no expiration</p>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        variant="destructive"
                        onClick={() => deleteCredential(selectedCredential.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete API Key
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Key className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Select an API credential to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
