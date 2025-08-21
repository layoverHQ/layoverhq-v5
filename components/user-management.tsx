"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  UserPlus,
  Clock,
  Eye,
  EyeOff,
  Download,
  Search,
  UserCheck,
  UserX,
  Edit,
  Key,
  Activity,
  Shield,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { useAdminAuth } from "./admin-auth-provider"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  role: string
  department: string
  phone?: string
  timezone?: string
  avatar_url?: string
  is_active: boolean
  last_login_at: string
  created_at: string
  updated_at: string
}

interface UserActivity {
  id: string
  user_id: string
  action: string
  resource_type: string
  ip_address: string
  user_agent: string
  timestamp: string
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [userActivities, setUserActivities] = useState<UserActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const [createForm, setCreateForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "user",
    department: "",
    phone: "",
    timezone: "UTC",
    password: "",
  })

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    role: "",
    department: "",
    phone: "",
    timezone: "",
    isActive: true,
  })

  const { hasPermission } = useAdminAuth()
  const supabase = createClient()

  const canManageUsers = hasPermission("manage-users")

  useEffect(() => {
    fetchUsers()
    fetchUserActivities()
  }, [])

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.is_active === (statusFilter === "active"))
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      console.log("[v0] UserManagement: Starting to fetch users...")
      const response = await fetch("/api/admin/users")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch users")
      }

      console.log(
        "[v0] UserManagement: Successfully fetched users count:",
        result.users?.length || 0,
      )
      setUsers(result.users || [])
    } catch (error) {
      console.error("[v0] UserManagement: Catch block error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserActivities = async () => {
    try {
      const response = await fetch("/api/admin/users/activities")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setUserActivities(data.activities || [])
    } catch (error) {
      console.error("Error fetching user activities:", error)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      alert("Please select users first")
      return
    }

    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userIds: selectedUsers }),
      })

      if (!response.ok) throw new Error("Bulk operation failed")

      setSelectedUsers([])
      await fetchUsers()
      alert(`Bulk ${action} completed successfully`)
    } catch (error) {
      console.error("Bulk operation error:", error)
      alert(`Bulk ${action} failed`)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      ["Name", "Email", "Role", "Department", "Status", "Created", "Last Login"],
      ...filteredUsers.map((user) => [
        user.display_name || `${user.first_name} ${user.last_name}`,
        user.email,
        user.role,
        user.department || "N/A",
        user.is_active ? "Active" : "Inactive",
        new Date(user.created_at).toLocaleDateString(),
        user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: "update",
        resource_type: "user",
        resource_id: userId,
        new_values: { role: newRole },
      })

      await fetchUsers()
    } catch (error) {
      console.error("Error updating user role:", error)
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId)

      if (error) throw error

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: userId,
        action: "update",
        resource_type: "user",
        resource_id: userId,
        new_values: { is_active: isActive },
      })

      await fetchUsers()
      alert("User status updated successfully!")
    } catch (error) {
      console.error("Error updating user status:", error)
      alert("Error updating user status")
    }
  }

  const createUser = async () => {
    if (!createForm.email || !createForm.firstName || !createForm.password) {
      alert("Please fill in all required fields")
      return
    }

    setIsCreating(true)
    console.log("[v0] Creating new user:", createForm.email)

    try {
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          role: createForm.role,
          department: createForm.department,
          phone: createForm.phone,
          timezone: createForm.timezone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.code === "USER_EXISTS") {
          alert(
            `User Creation Failed: ${result.error}\n\nWould you like to search for the existing user instead?`,
          )
          setSearchTerm(createForm.email)
          setIsCreateDialogOpen(false)
          return
        }
        throw new Error(result.error || "Failed to create user")
      }

      console.log("[v0] User created successfully:", result.user.id)

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: result.user.id,
        action: "create",
        resource_type: "user",
        resource_id: result.user.id,
        new_values: {
          email: createForm.email,
          role: createForm.role,
          department: createForm.department,
        },
      })

      // Reset form and close dialog
      setCreateForm({
        email: "",
        firstName: "",
        lastName: "",
        role: "user",
        department: "",
        phone: "",
        timezone: "UTC",
        password: "",
      })
      setIsCreateDialogOpen(false)

      await fetchUsers()

      alert("User created successfully!")
    } catch (error: any) {
      console.error("[v0] Error creating user:", error.message)
      if (
        error.message.includes("already exists") ||
        error.message.includes("already been registered")
      ) {
        alert(
          `User Creation Failed: A user with the email "${createForm.email}" already exists.\n\nPlease use a different email address or search for the existing user.`,
        )
        setSearchTerm(createForm.email)
      } else {
        alert(`Failed to create user: ${error.message}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user)
    setEditForm({
      firstName: user.first_name,
      lastName: user.last_name,
      displayName: user.display_name,
      role: user.role,
      department: user.department || "",
      phone: user.phone || "",
      timezone: user.timezone || "UTC",
      isActive: user.is_active,
    })
    setIsEditDialogOpen(true)
  }

  const updateUser = async () => {
    if (!selectedUser) return

    try {
      console.log("[v0] Updating user via API:", selectedUser.id)

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update user")
      }

      setIsEditDialogOpen(false)
      await fetchUsers()
      alert("User updated successfully!")
    } catch (error) {
      console.error("Error updating user:", error)
      alert(`Error updating user: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const resetUserPassword = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase.auth.admin.updateUserById(selectedUser.id, {
        password: Math.random().toString(36).slice(-8),
      })

      if (error) throw error

      // Log audit trail
      await supabase.from("audit_logs").insert({
        user_id: selectedUser.id,
        action: "password_reset",
        resource_type: "user",
        resource_id: selectedUser.id,
      })

      setIsPasswordResetDialogOpen(false)
      alert("Password reset successfully! User will receive an email with instructions.")
    } catch (error) {
      console.error("Error resetting password:", error)
      alert("Error resetting password")
    }
  }

  const syncAuthUsers = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Starting user sync...")

      const response = await fetch("/api/admin/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Sync failed")
      }

      console.log("[v0] Sync completed:", result)
      await fetchUsers()

      if (result.synced > 0) {
        alert(`Successfully synced ${result.synced} users from Auth to profiles!`)
      } else {
        alert("All Auth users already have profile records.")
      }
    } catch (error: any) {
      console.error("[v0] Error syncing users:", error)
      alert(`Sync failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getUserStats = () => {
    const totalUsers = users.length
    const activeUsers = users.filter((u) => u.is_active).length
    const adminUsers = users.filter((u) => u.role === "admin").length
    const managerUsers = users.filter((u) => u.role === "manager").length

    return { totalUsers, activeUsers, adminUsers, managerUsers }
  }

  const stats = getUserStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.adminUsers}</div>
                <p className="text-xs text-muted-foreground">Admin users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Managers</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.managerUsers}</div>
                <p className="text-xs text-muted-foreground">Manager users</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common user management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {canManageUsers && (
                  <>
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add New User
                    </Button>
                    <Button
                      onClick={syncAuthUsers}
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Users className="h-4 w-4" />
                      Sync Auth Users
                    </Button>
                    <Button
                      onClick={exportToCSV}
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* ... existing users table code ... */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {canManageUsers && selectedUsers.length > 0 && (
                <div className="flex gap-2 mb-4 p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{selectedUsers.length} users selected</span>
                  <Button size="sm" onClick={() => handleBulkAction("activate")} variant="outline">
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction("deactivate")}
                    variant="outline"
                  >
                    Deactivate
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction("delete")}
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canManageUsers && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedUsers.length === filteredUsers.length &&
                              filteredUsers.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      {canManageUsers && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        {canManageUsers && (
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers([...selectedUsers, user.id])
                                } else {
                                  setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                                }
                              }}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.display_name || `${user.first_name} ${user.last_name}`}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {canManageUsers ? (
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateUserRole(user.id, value)}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.department || "N/A"}</TableCell>
                        <TableCell>
                          {canManageUsers ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserStatus(user.id, !user.is_active)}
                              className={user.is_active ? "text-green-600" : "text-red-600"}
                            >
                              {user.is_active ? (
                                <UserCheck className="h-4 w-4" />
                              ) : (
                                <UserX className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.last_login_at ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(user.last_login_at).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        {canManageUsers && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsActivityDialogOpen(true)
                                }}
                              >
                                <Activity className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsPasswordResetDialogOpen(true)
                                }}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first user"}
                  </p>
                  {canManageUsers && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>User activity and audit logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.resource_type} • {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>User registration trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">{stats.totalUsers}</span>
                  <span className="text-sm text-muted-foreground">total users</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>Users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Admins</span>
                    <span className="font-medium">{stats.adminUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Managers</span>
                    <span className="font-medium">{stats.managerUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Users</span>
                    <span className="font-medium">
                      {stats.totalUsers - stats.adminUsers - stats.managerUsers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system with their profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="col-span-3"
                placeholder="user@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password *
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={createForm.role}
                onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={createUser} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile information and settings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editFirstName" className="text-right">
                First Name
              </Label>
              <Input
                id="editFirstName"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editLastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="editLastName"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editRole" className="text-right">
                Role
              </Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editDepartment" className="text-right">
                Department
              </Label>
              <Input
                id="editDepartment"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={updateUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset the password for {selectedUser?.display_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">
                This will generate a new temporary password and send reset instructions to the
                user's email.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordResetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={resetUserPassword}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Activity</DialogTitle>
            <DialogDescription>
              Recent activity for {selectedUser?.display_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {userActivities
                .filter((activity) => activity.user_id === selectedUser?.id)
                .slice(0, 20)
                .map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{activity.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.resource_type} • {new Date(activity.timestamp).toLocaleString()}
                      </div>
                      {activity.ip_address && (
                        <div className="text-xs text-muted-foreground mt-1">
                          IP: {activity.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsActivityDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagement
