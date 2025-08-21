"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast"
import {
  Building2,
  Users,
  Key,
  Activity,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash,
  Copy,
  Shield,
  Globe,
} from "lucide-react"

interface Tenant {
  id: string
  name: string
  slug: string
  status: "active" | "pending" | "suspended"
  plan: "free" | "startup" | "growth" | "enterprise"
  owner_email: string
  owner_name: string
  created_at: string
  users?: any[]
  api_credentials?: any[]
  usage_statistics?: {
    total_requests_30d: number
    total_revenue_30d: number
    avg_response_time_ms: number
    error_rate_percent: number
  }
  white_label?: {
    enabled: boolean
    custom_domain?: string
    brand_colors?: any
  }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPlan, setFilterPlan] = useState<string>("all")
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const { toast } = useToast()

  // New tenant form state
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    owner_email: "",
    owner_name: "",
    plan: "startup",
  })

  useEffect(() => {
    loadTenants()
  }, [filterStatus, filterPlan])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterPlan !== "all") params.append("plan", filterPlan)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/admin/tenants?${params}`)
      if (!response.ok) throw new Error("Failed to load tenants")

      const data = await response.json()
      setTenants(data.tenants)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tenants",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createTenant = async () => {
    try {
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTenant),
      })

      if (!response.ok) throw new Error("Failed to create tenant")

      const data = await response.json()
      toast({
        title: "Success",
        description: `Tenant ${data.tenant.name} created successfully`,
      })

      setShowCreateDialog(false)
      setNewTenant({ name: "", slug: "", owner_email: "", owner_name: "", plan: "startup" })
      loadTenants()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tenant",
        variant: "destructive",
      })
    }
  }

  const updateTenantStatus = async (tenantId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Failed to update tenant")

      toast({
        title: "Success",
        description: "Tenant status updated",
      })
      loadTenants()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tenant",
        variant: "destructive",
      })
    }
  }

  const generateApiKey = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Generated API Key" }),
      })

      if (!response.ok) throw new Error("Failed to generate API key")

      const data = await response.json()
      toast({
        title: "API Key Generated",
        description: "Copy this key now, it won't be shown again: " + data.apiKey,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success"
      case "pending":
        return "warning"
      case "suspended":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "destructive"
      case "growth":
        return "default"
      case "startup":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground">
            Manage enterprise customers and their configurations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tenant
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">Active enterprise customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + (t.users?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenants.reduce((sum, t) => sum + (t.api_credentials?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active credentials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {tenants
                .reduce((sum, t) => sum + (t.usage_statistics?.total_revenue_30d || 0), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadTenants}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>API Usage (30d)</TableHead>
                <TableHead>Revenue (30d)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading tenants...
                  </TableCell>
                </TableRow>
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-sm text-muted-foreground">{tenant.slug}</div>
                        {tenant.white_label?.enabled && (
                          <Badge variant="outline" className="mt-1">
                            <Globe className="mr-1 h-3 w-3" />
                            White Label
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(tenant.status) as any}>{tenant.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPlanBadge(tenant.plan) as any}>{tenant.plan}</Badge>
                    </TableCell>
                    <TableCell>{tenant.users?.length || 0}</TableCell>
                    <TableCell>
                      {tenant.usage_statistics?.total_requests_30d?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      ${tenant.usage_statistics?.total_revenue_30d?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTenant(tenant)
                            setShowDetailsDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateApiKey(tenant.id)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateTenantStatus(
                              tenant.id,
                              tenant.status === "active" ? "suspended" : "active",
                            )
                          }
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Set up a new enterprise customer with full multi-tenant isolation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Acme Airlines"
                />
              </div>
              <div>
                <Label>URL Slug</Label>
                <Input
                  value={newTenant.slug}
                  onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                  placeholder="acme-airlines"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner Name</Label>
                <Input
                  value={newTenant.owner_name}
                  onChange={(e) => setNewTenant({ ...newTenant, owner_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>Owner Email</Label>
                <Input
                  type="email"
                  value={newTenant.owner_email}
                  onChange={(e) => setNewTenant({ ...newTenant, owner_email: e.target.value })}
                  placeholder="john@acmeairlines.com"
                />
              </div>
            </div>
            <div>
              <Label>Plan</Label>
              <Select
                value={newTenant.plan}
                onValueChange={(value) => setNewTenant({ ...newTenant, plan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createTenant}>Create Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tenant Details Dialog */}
      {selectedTenant && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTenant.name}</DialogTitle>
              <DialogDescription>Tenant ID: {selectedTenant.id}</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="api">API Keys</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input value={selectedTenant.name} readOnly />
                  </div>
                  <div>
                    <Label>URL Slug</Label>
                    <Input value={selectedTenant.slug} readOnly />
                  </div>
                  <div>
                    <Label>Owner</Label>
                    <Input value={selectedTenant.owner_name} readOnly />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={selectedTenant.owner_email} readOnly />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={selectedTenant.status}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Plan</Label>
                    <Select value={selectedTenant.plan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="users">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium">User Management</h3>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTenant.users?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <Badge>{user.status}</Badge>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="api">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium">API Credentials</h3>
                    <Button size="sm" onClick={() => generateApiKey(selectedTenant.id)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Key
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTenant.api_credentials?.map((cred: any) => (
                        <TableRow key={cred.id}>
                          <TableCell>{cred.name}</TableCell>
                          <TableCell>{new Date(cred.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {cred.last_used_at
                              ? new Date(cred.last_used_at).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={cred.is_active ? "default" : "destructive"} className={cred.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}>
                              {cred.is_active ? "Active" : "Revoked"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No API keys found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="usage">
                <div className="space-y-4">
                  <h3 className="font-medium">Usage Statistics (Last 30 Days)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Total Requests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedTenant.usage_statistics?.total_requests_30d?.toLocaleString() ||
                            0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          $
                          {selectedTenant.usage_statistics?.total_revenue_30d?.toFixed(2) || "0.00"}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Avg Response Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedTenant.usage_statistics?.avg_response_time_ms || 0}ms
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Error Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedTenant.usage_statistics?.error_rate_percent || 0}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="config">
                <div className="space-y-4">
                  <h3 className="font-medium">White Label Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Custom Domain</Label>
                      <Input
                        placeholder="layovers.acmeairlines.com"
                        value={selectedTenant.white_label?.custom_domain || ""}
                      />
                    </div>
                    <div>
                      <Label>Brand Colors</Label>
                      <Textarea
                        placeholder="JSON configuration for brand colors"
                        value={JSON.stringify(
                          selectedTenant.white_label?.brand_colors || {},
                          null,
                          2,
                        )}
                        rows={6}
                      />
                    </div>
                    <Button>Save Configuration</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
