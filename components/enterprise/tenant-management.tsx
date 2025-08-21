/**
 * Tenant Management - Multi-Tenant Customer Administration
 *
 * Comprehensive tenant management interface for enterprise customers
 * with onboarding, configuration, and monitoring capabilities.
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Search,
  Settings,
  Users,
  Activity,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit,
  Trash2,
  Key,
  Globe,
  Shield,
  TrendingUp,
} from "lucide-react"

interface Enterprise {
  id: string
  name: string
  slug: string
  domain?: string
  subdomain?: string
  subscription_plan: "free" | "starter" | "professional" | "enterprise"
  subscription_status: "active" | "trial" | "suspended" | "churned"
  billing_customer_id?: string
  api_key_hash?: string
  rate_limits: Record<string, number>
  usage_quotas: Record<string, number>
  current_usage: Record<string, number>
  white_label_config: Record<string, any>
  enabled_features: string[]
  status: "active" | "suspended" | "trial" | "churned" | "deleted"
  data_residency_region: string
  created_at: string
  updated_at: string
  user_count?: number
  monthly_api_calls?: number
  monthly_revenue?: number
}

interface TenantUser {
  id: string
  email: string
  role_in_enterprise: "owner" | "admin" | "manager" | "member" | "viewer"
  subscription_tier: string
  last_login?: string
  created_at: string
}

interface CreateTenantRequest {
  name: string
  slug: string
  domain?: string
  subdomain?: string
  subscription_plan: string
  data_residency_region: string
  owner_email: string
  owner_name: string
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Enterprise[]>([])
  const [filteredTenants, setFilteredTenants] = useState<Enterprise[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Enterprise | null>(null)
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createTenantData, setCreateTenantData] = useState<CreateTenantRequest>({
    name: "",
    slug: "",
    domain: "",
    subdomain: "",
    subscription_plan: "starter",
    data_residency_region: "us-east-1",
    owner_email: "",
    owner_name: "",
  })

  useEffect(() => {
    loadTenants()
  }, [])

  useEffect(() => {
    filterTenants()
  }, [tenants, searchQuery, statusFilter, planFilter])

  const loadTenants = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/tenants")
      if (response.ok) {
        const data = await response.json()
        setTenants(data.tenants || [])
      }
    } catch (error) {
      console.error("Failed to load tenants:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterTenants = () => {
    let filtered = tenants

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tenant.domain?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((tenant) => tenant.status === statusFilter)
    }

    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter((tenant) => tenant.subscription_plan === planFilter)
    }

    setFilteredTenants(filtered)
  }

  const loadTenantUsers = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/users`)
      if (response.ok) {
        const data = await response.json()
        setTenantUsers(data.users || [])
      }
    } catch (error) {
      console.error("Failed to load tenant users:", error)
    }
  }

  const createTenant = async () => {
    try {
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createTenantData),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await loadTenants()
          setShowCreateDialog(false)
          setCreateTenantData({
            name: "",
            slug: "",
            domain: "",
            subdomain: "",
            subscription_plan: "starter",
            data_residency_region: "us-east-1",
            owner_email: "",
            owner_name: "",
          })
        }
      }
    } catch (error) {
      console.error("Error creating tenant:", error)
    }
  }

  const updateTenantStatus = async (tenantId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await loadTenants()
      }
    } catch (error) {
      console.error("Error updating tenant status:", error)
    }
  }

  const generateApiKey = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/api-key`, {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        alert(`New API Key: ${result.api_key}\n\nPlease save this key as it won't be shown again.`)
        await loadTenants()
      }
    } catch (error) {
      console.error("Error generating API key:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "trial":
        return "bg-blue-100 text-blue-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      case "churned":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      case "professional":
        return "bg-blue-100 text-blue-800"
      case "starter":
        return "bg-green-100 text-green-800"
      case "free":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading tenants...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tenant Management</CardTitle>
              <CardDescription>
                Manage enterprise customers, their configurations, and user access across the
                platform.
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Tenant</DialogTitle>
                  <DialogDescription>
                    Set up a new enterprise customer with initial configuration.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      value={createTenantData.name}
                      onChange={(e) =>
                        setCreateTenantData((prev) => ({
                          ...prev,
                          name: e.target.value,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={createTenantData.slug}
                      onChange={(e) =>
                        setCreateTenantData((prev) => ({
                          ...prev,
                          slug: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner_email">Owner Email</Label>
                    <Input
                      id="owner_email"
                      type="email"
                      value={createTenantData.owner_email}
                      onChange={(e) =>
                        setCreateTenantData((prev) => ({
                          ...prev,
                          owner_email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner_name">Owner Name</Label>
                    <Input
                      id="owner_name"
                      value={createTenantData.owner_name}
                      onChange={(e) =>
                        setCreateTenantData((prev) => ({
                          ...prev,
                          owner_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">Subscription Plan</Label>
                    <Select
                      value={createTenantData.subscription_plan}
                      onValueChange={(value) =>
                        setCreateTenantData((prev) => ({
                          ...prev,
                          subscription_plan: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Data Residency</Label>
                    <Select
                      value={createTenantData.data_residency_region}
                      onValueChange={(value) =>
                        setCreateTenantData((prev) => ({
                          ...prev,
                          data_residency_region: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us-east-1">US East (Virginia)</SelectItem>
                        <SelectItem value="eu-west-1">EU West (Ireland)</SelectItem>
                        <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createTenant}
                    disabled={!createTenantData.name || !createTenantData.owner_email}
                  >
                    Create Tenant
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenant List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTenants.map((tenant) => (
          <Card
            key={tenant.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedTenant(tenant)}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-semibold">{tenant.name}</h3>
                    <p className="text-sm text-gray-600">{tenant.slug}</p>
                    {tenant.domain && <p className="text-xs text-gray-500">{tenant.domain}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{tenant.user_count || 0} users</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {(tenant.monthly_api_calls || 0).toLocaleString()} calls/mo
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getPlanColor(tenant.subscription_plan)}>
                        {tenant.subscription_plan.toUpperCase()}
                      </Badge>
                    </div>
                    <Badge className={getStatusColor(tenant.status)}>
                      {tenant.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        ${(tenant.monthly_revenue || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{tenant.data_residency_region}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTenants.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No tenants found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tenant Details Dialog */}
      {selectedTenant && (
        <Dialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{selectedTenant.name}</span>
                <Badge className={getStatusColor(selectedTenant.status)}>
                  {selectedTenant.status.toUpperCase()}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Manage tenant configuration, users, and settings.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">Slug</Label>
                        <p className="text-sm">{selectedTenant.slug}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Domain</Label>
                        <p className="text-sm">{selectedTenant.domain || "Not configured"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Created</Label>
                        <p className="text-sm">
                          {new Date(selectedTenant.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Subscription</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label className="text-xs text-gray-500">Plan</Label>
                        <p className="text-sm">{selectedTenant.subscription_plan}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Status</Label>
                        <p className="text-sm">{selectedTenant.subscription_status}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Region</Label>
                        <p className="text-sm">{selectedTenant.data_residency_region}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => generateApiKey(selectedTenant.id)}>
                    <Key className="h-4 w-4 mr-2" />
                    Generate API Key
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateTenantStatus(
                        selectedTenant.id,
                        selectedTenant.status === "active" ? "suspended" : "active",
                      )
                    }
                  >
                    {selectedTenant.status === "active" ? "Suspend" : "Activate"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Users ({tenantUsers.length})</h3>
                  <Button size="sm" onClick={() => loadTenantUsers(selectedTenant.id)}>
                    Refresh
                  </Button>
                </div>

                <div className="space-y-2">
                  {tenantUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-gray-600">
                          {user.role_in_enterprise} • {user.subscription_tier}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          Last login:{" "}
                          {user.last_login
                            ? new Date(user.last_login).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Rate Limits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(selectedTenant.rate_limits || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label className="text-sm">{key.replace(/_/g, " ").toUpperCase()}</Label>
                          <Badge variant="outline">{value}/min</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Enabled Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedTenant.enabled_features?.map((feature) => (
                        <Badge key={feature} variant="default">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="usage" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(selectedTenant.current_usage || {}).map(([key, value]) => {
                    const quota = selectedTenant.usage_quotas?.[key] || 0
                    const percentage = quota > 0 ? (Number(value) / quota) * 100 : 0

                    return (
                      <Card key={key}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">
                            {key.replace(/_/g, " ").toUpperCase()}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{Number(value).toLocaleString()}</span>
                              <span>{quota.toLocaleString()} limit</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            <p className="text-xs text-gray-500">
                              {percentage.toFixed(1)}% of quota used
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
