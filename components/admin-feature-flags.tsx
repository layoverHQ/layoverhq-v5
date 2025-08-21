"use client"

/**
 * Feature Flags Management Interface
 *
 * Comprehensive interface for managing feature flags with tenant overrides,
 * A/B testing, user segmentation, and real-time evaluation.
 */

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Flag,
  Plus,
  Edit,
  Trash2,
  Copy,
  Users,
  Settings,
  BarChart3,
  Zap,
  RefreshCw,
  Save,
  X,
  TestTube,
  Target,
  Globe,
  Building,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FeatureFlag {
  id: string
  key: string
  name: string
  description?: string
  is_enabled: boolean
  tenant_id?: string
  user_segment: Record<string, any>
  rollout_percentage: number
  conditions: Record<string, any>
  created_at: string
  updated_at: string
  created_by: string
}

interface FlagFormData {
  key: string
  name: string
  description: string
  is_enabled: boolean
  tenant_id: string
  rollout_percentage: number
  user_segment: {
    conditions: Array<{
      type: string
      operator: string
      value: string
      property_name?: string
    }>
  }
  conditions: Record<string, any>
}

interface EvaluationTest {
  user_id: string
  tenant_id?: string
  email?: string
  role?: string
  plan?: string
  properties?: Record<string, string>
}

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterEnabled, setFilterEnabled] = useState<string>("all")
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<FlagFormData>({
    key: "",
    name: "",
    description: "",
    is_enabled: false,
    tenant_id: "",
    rollout_percentage: 0,
    user_segment: { conditions: [] },
    conditions: {},
  })

  // Test evaluation state
  const [testData, setTestData] = useState<EvaluationTest>({
    user_id: "",
    tenant_id: "",
    email: "",
    role: "",
    plan: "",
    properties: {},
  })
  const [testResult, setTestResult] = useState<any>(null)

  /**
   * Load feature flags
   */
  const loadFlags = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedTenant) params.append("tenant_id", selectedTenant)
      if (filterEnabled !== "all") params.append("enabled", filterEnabled)

      const response = await fetch(`/api/admin/feature-flags?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFlags(data)
      } else {
        throw new Error("Failed to load flags")
      }
    } catch (error) {
      console.error("Error loading flags:", error)
      toast({
        title: "Error",
        description: "Failed to load feature flags",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedTenant, filterEnabled, toast])

  /**
   * Create feature flag
   */
  const createFlag = async () => {
    if (!formData.key || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Key and name are required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadFlags()
        setShowCreateDialog(false)
        resetForm()
        toast({
          title: "Success",
          description: "Feature flag created successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create flag")
      }
    } catch (error) {
      console.error("Error creating flag:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create flag",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Update feature flag
   */
  const updateFlag = async () => {
    if (!selectedFlag) return

    setIsSaving(true)
    try {
      const { key, ...updateData } = formData
      const response = await fetch(`/api/admin/feature-flags/${selectedFlag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        await loadFlags()
        setShowEditDialog(false)
        setSelectedFlag(null)
        resetForm()
        toast({
          title: "Success",
          description: "Feature flag updated successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update flag")
      }
    } catch (error) {
      console.error("Error updating flag:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update flag",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Delete feature flag
   */
  const deleteFlag = async (flag: FeatureFlag) => {
    if (!confirm(`Are you sure you want to delete the flag "${flag.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadFlags()
        toast({
          title: "Success",
          description: "Feature flag deleted successfully",
        })
      } else {
        throw new Error("Failed to delete flag")
      }
    } catch (error) {
      console.error("Error deleting flag:", error)
      toast({
        title: "Error",
        description: "Failed to delete feature flag",
        variant: "destructive",
      })
    }
  }

  /**
   * Test flag evaluation
   */
  const testFlagEvaluation = async () => {
    if (!selectedFlag || !testData.user_id) {
      toast({
        title: "Validation Error",
        description: "User ID is required for testing",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/feature-flags/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: selectedFlag.key,
          user_context: testData,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setTestResult(result)
      } else {
        throw new Error("Failed to evaluate flag")
      }
    } catch (error) {
      console.error("Error testing flag:", error)
      toast({
        title: "Error",
        description: "Failed to test flag evaluation",
        variant: "destructive",
      })
    }
  }

  /**
   * Toggle flag enabled state
   */
  const toggleFlag = async (flag: FeatureFlag) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: !flag.is_enabled }),
      })

      if (response.ok) {
        await loadFlags()
        toast({
          title: "Success",
          description: `Flag ${!flag.is_enabled ? "enabled" : "disabled"} successfully`,
        })
      } else {
        throw new Error("Failed to toggle flag")
      }
    } catch (error) {
      console.error("Error toggling flag:", error)
      toast({
        title: "Error",
        description: "Failed to toggle feature flag",
        variant: "destructive",
      })
    }
  }

  /**
   * Copy flag key to clipboard
   */
  const copyFlagKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "Copied",
      description: "Flag key copied to clipboard",
    })
  }

  /**
   * Reset form data
   */
  const resetForm = () => {
    setFormData({
      key: "",
      name: "",
      description: "",
      is_enabled: false,
      tenant_id: "",
      rollout_percentage: 0,
      user_segment: { conditions: [] },
      conditions: {},
    })
  }

  /**
   * Populate form with flag data for editing
   */
  const editFlag = (flag: FeatureFlag) => {
    setSelectedFlag(flag)
    setFormData({
      key: flag.key,
      name: flag.name,
      description: flag.description || "",
      is_enabled: flag.is_enabled,
      tenant_id: flag.tenant_id || "",
      rollout_percentage: flag.rollout_percentage,
      user_segment: flag.user_segment || ({ conditions: [] } as any),
      conditions: flag.conditions || {},
    })
    setShowEditDialog(true)
  }

  /**
   * Add user segment condition
   */
  const addSegmentCondition = () => {
    setFormData((prev) => ({
      ...prev,
      user_segment: {
        ...prev.user_segment,
        conditions: [
          ...prev.user_segment.conditions,
          { type: "user_id", operator: "equals", value: "" },
        ],
      },
    }))
  }

  /**
   * Remove user segment condition
   */
  const removeSegmentCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      user_segment: {
        ...prev.user_segment,
        conditions: prev.user_segment.conditions.filter((_, i) => i !== index),
      },
    }))
  }

  /**
   * Update segment condition
   */
  const updateSegmentCondition = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      user_segment: {
        ...prev.user_segment,
        conditions: prev.user_segment.conditions.map((condition, i) =>
          i === index ? { ...condition, [field]: value } : condition,
        ),
      },
    }))
  }

  // Filter flags based on search and filters
  const filteredFlags = flags.filter((flag) => {
    const matchesSearch =
      !searchQuery ||
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterEnabled === "all" ||
      (filterEnabled === "true" && flag.is_enabled) ||
      (filterEnabled === "false" && !flag.is_enabled)

    return matchesSearch && matchesFilter
  })

  // Load flags on component mount
  useEffect(() => {
    loadFlags()
  }, [loadFlags])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="text-gray-600">
            Manage feature flags with tenant overrides and A/B testing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadFlags} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Flag
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search flags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tenant">Tenant Filter</Label>
              <Input
                id="tenant"
                placeholder="Tenant ID (optional)"
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="enabled">Status</Label>
              <Select value={filterEnabled} onValueChange={setFilterEnabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flags</SelectItem>
                  <SelectItem value="true">Enabled Only</SelectItem>
                  <SelectItem value="false">Disabled Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flags Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags ({filteredFlags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rollout</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlags.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Flag className="h-4 w-4" />
                        <span className="font-medium">{flag.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => copyFlagKey(flag.key)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 font-mono">{flag.key}</p>
                      {flag.description && (
                        <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch checked={flag.is_enabled} onCheckedChange={() => toggleFlag(flag)} />
                      <Badge variant={flag.is_enabled ? "default" : "secondary"}>
                        {flag.is_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span>{flag.rollout_percentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {flag.tenant_id ? (
                        <Badge variant="outline" className="flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          Tenant
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          Global
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(flag.updated_at).toLocaleDateString()}</p>
                      <p className="text-gray-600">
                        {new Date(flag.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => editFlag(flag)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFlag(flag)
                          setShowTestDialog(true)
                        }}
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFlag(flag)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setShowEditDialog(false)
            setSelectedFlag(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showCreateDialog ? "Create Feature Flag" : "Edit Feature Flag"}
            </DialogTitle>
            <DialogDescription>
              Configure the feature flag settings and targeting conditions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flag-key">Flag Key *</Label>
                <Input
                  id="flag-key"
                  placeholder="feature_name"
                  value={formData.key}
                  onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                  disabled={showEditDialog}
                />
              </div>
              <div>
                <Label htmlFor="flag-name">Display Name *</Label>
                <Input
                  id="flag-name"
                  placeholder="Feature Name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="flag-description">Description</Label>
              <Textarea
                id="flag-description"
                placeholder="Describe what this flag controls..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_enabled: checked }))
                  }
                />
                <Label>Enable Flag</Label>
              </div>
              <div>
                <Label htmlFor="flag-tenant">Tenant ID (Optional)</Label>
                <Input
                  id="flag-tenant"
                  placeholder="Leave empty for global flag"
                  value={formData.tenant_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tenant_id: e.target.value }))}
                />
              </div>
            </div>

            {/* Rollout Percentage */}
            <div>
              <Label>Rollout Percentage: {formData.rollout_percentage}%</Label>
              <Slider
                value={[formData.rollout_percentage]}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, rollout_percentage: value[0] }))
                }
                max={100}
                step={1}
                className="mt-2"
              />
            </div>

            {/* User Segment Conditions */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>User Targeting Conditions</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSegmentCondition}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>

              <div className="space-y-3">
                {formData.user_segment.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded">
                    <Select
                      value={condition.type}
                      onValueChange={(value) => updateSegmentCondition(index, "type", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user_id">User ID</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="role">Role</SelectItem>
                        <SelectItem value="plan">Plan</SelectItem>
                        <SelectItem value="property">Property</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateSegmentCondition(index, "operator", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="in">In List</SelectItem>
                        <SelectItem value="not_in">Not In List</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateSegmentCondition(index, "value", e.target.value)}
                      className="flex-1"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSegmentCondition(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={showCreateDialog ? createFlag : updateFlag} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {showCreateDialog ? "Create Flag" : "Update Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Flag Evaluation</DialogTitle>
            <DialogDescription>
              Test how the flag evaluates for different user contexts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="test-user-id">User ID *</Label>
              <Input
                id="test-user-id"
                placeholder="user-123"
                value={testData.user_id}
                onChange={(e) => setTestData((prev) => ({ ...prev, user_id: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-email">Email</Label>
                <Input
                  id="test-email"
                  placeholder="user@example.com"
                  value={testData.email}
                  onChange={(e) => setTestData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="test-role">Role</Label>
                <Input
                  id="test-role"
                  placeholder="admin"
                  value={testData.role}
                  onChange={(e) => setTestData((prev) => ({ ...prev, role: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={testFlagEvaluation} className="w-full">
              <TestTube className="h-4 w-4 mr-2" />
              Test Evaluation
            </Button>

            {testResult && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <strong>Result:</strong>
                      <Badge variant={testResult.enabled ? "default" : "secondary"}>
                        {testResult.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div>
                      <strong>Reason:</strong> {testResult.reason}
                    </div>
                    {testResult.metadata && (
                      <div>
                        <strong>Metadata:</strong>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                          {JSON.stringify(testResult.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
