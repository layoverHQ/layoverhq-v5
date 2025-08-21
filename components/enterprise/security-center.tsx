"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Users,
  Activity,
  FileText,
  Globe,
  Zap,
} from "lucide-react"

// Mock security data - in production, this would come from the API
const mockSecurityData = {
  threatLevel: "low",
  activeSessions: 247,
  failedLogins: 12,
  suspiciousActivity: 3,
  lastScan: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  vulnerabilities: {
    critical: 0,
    high: 2,
    medium: 5,
    low: 12,
  },
  compliance: {
    gdpr: true,
    ccpa: true,
    soc2: true,
    iso27001: false,
  },
  firewallRules: 156,
  blockedRequests: 1247,
  rateLimit: {
    enabled: true,
    requests: 1000,
    window: 3600,
  },
  twoFactorAuth: {
    enabled: true,
    coverage: 85,
  },
  auditLogs: [
    {
      id: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      action: "admin_login",
      user: "admin@layoverhq.com",
      ip: "192.168.1.100",
      status: "success",
      details: "Admin dashboard access",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      action: "config_change",
      user: "admin@layoverhq.com",
      ip: "192.168.1.100",
      status: "success",
      details: "Updated API rate limits",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      action: "failed_login",
      user: "unknown@example.com",
      ip: "203.0.113.45",
      status: "failed",
      details: "Invalid credentials - 3 attempts",
    },
  ],
}

export default function SecurityCenter() {
  const [securityData, setSecurityData] = useState(mockSecurityData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const refreshData = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLastUpdate(new Date())
    setIsRefreshing(false)
  }

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600"
      case "medium":
        return "text-yellow-600"
      case "high":
        return "text-orange-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getThreatLevelBadge = (level: string) => {
    switch (level) {
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High Risk</Badge>
      case "critical":
        return <Badge variant="destructive">Critical Risk</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Security Center</h2>
          <p className="text-muted-foreground">
            Enterprise security monitoring and threat management
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Last scan: {new Date(securityData.lastScan).toLocaleTimeString()}
          </span>
          <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Threat Level</p>
                <p
                  className={`text-2xl font-bold ${getThreatLevelColor(securityData.threatLevel)}`}
                >
                  {securityData.threatLevel.toUpperCase()}
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">{getThreatLevelBadge(securityData.threatLevel)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{securityData.activeSessions}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Badge className="bg-blue-100 text-blue-800">
                {securityData.twoFactorAuth.coverage}% 2FA enabled
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Logins (24h)</p>
                <p className="text-2xl font-bold text-red-600">{securityData.failedLogins}</p>
              </div>
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Badge variant="outline">{securityData.suspiciousActivity} suspicious</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blocked Requests</p>
                <p className="text-2xl font-bold">{securityData.blockedRequests}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Badge className="bg-green-100 text-green-800">
                {securityData.firewallRules} firewall rules
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Tabs */}
      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Threat Detection</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vulnerability Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Vulnerability Assessment</span>
                </CardTitle>
                <CardDescription>Current system vulnerabilities by severity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Critical</span>
                    <Badge variant="destructive">{securityData.vulnerabilities.critical}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">High</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {securityData.vulnerabilities.high}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Medium</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {securityData.vulnerabilities.medium}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Low</span>
                    <Badge variant="outline">{securityData.vulnerabilities.low}</Badge>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Detailed Report
                </Button>
              </CardContent>
            </Card>

            {/* Rate Limiting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Rate Limiting</span>
                </CardTitle>
                <CardDescription>API rate limiting configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rate-limit-enabled">Enable Rate Limiting</Label>
                  <Switch
                    id="rate-limit-enabled"
                    checked={securityData.rateLimit.enabled}
                    onCheckedChange={() => {
                      setSecurityData((prev) => ({
                        ...prev,
                        rateLimit: {
                          ...prev.rateLimit,
                          enabled: !prev.rateLimit.enabled,
                        },
                      }))
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requests-per-hour">Requests per Hour</Label>
                  <Input
                    id="requests-per-hour"
                    type="number"
                    value={securityData.rateLimit.requests}
                    onChange={(e) => {
                      setSecurityData((prev) => ({
                        ...prev,
                        rateLimit: {
                          ...prev.rateLimit,
                          requests: parseInt(e.target.value),
                        },
                      }))
                    }}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  Current window: {securityData.rateLimit.window / 3600} hour(s)
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Two-Factor Authentication</span>
                </CardTitle>
                <CardDescription>Multi-factor authentication status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="2fa-enabled">Enforce 2FA</Label>
                  <Switch
                    id="2fa-enabled"
                    checked={securityData.twoFactorAuth.enabled}
                    onCheckedChange={() => {
                      setSecurityData((prev) => ({
                        ...prev,
                        twoFactorAuth: {
                          ...prev.twoFactorAuth,
                          enabled: !prev.twoFactorAuth.enabled,
                        },
                      }))
                    }}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Coverage</span>
                    <span>{securityData.twoFactorAuth.coverage}%</span>
                  </div>
                  <Progress value={securityData.twoFactorAuth.coverage} />
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {securityData.twoFactorAuth.coverage}% of users have enabled 2FA. Consider
                    requiring 2FA for all admin accounts.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Session Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Session Management</span>
                </CardTitle>
                <CardDescription>Active session monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Sessions</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {securityData.activeSessions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Failed Logins (24h)</span>
                    <Badge variant="destructive">{securityData.failedLogins}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Suspicious Activity</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {securityData.suspiciousActivity}
                    </Badge>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Sessions
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Compliance Status</span>
              </CardTitle>
              <CardDescription>Current compliance with security standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">GDPR</h4>
                      <p className="text-sm text-muted-foreground">
                        General Data Protection Regulation
                      </p>
                    </div>
                    {securityData.compliance.gdpr ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">CCPA</h4>
                      <p className="text-sm text-muted-foreground">
                        California Consumer Privacy Act
                      </p>
                    </div>
                    {securityData.compliance.ccpa ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">SOC 2</h4>
                      <p className="text-sm text-muted-foreground">
                        Service Organization Control 2
                      </p>
                    </div>
                    {securityData.compliance.soc2 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">ISO 27001</h4>
                      <p className="text-sm text-muted-foreground">
                        Information Security Management
                      </p>
                    </div>
                    {securityData.compliance.iso27001 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Security Audit Logs</span>
              </CardTitle>
              <CardDescription>Recent security events and administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityData.auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0">{getStatusIcon(log.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {log.action.replace("_", " ").toUpperCase()}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span>User: {log.user}</span>
                        <span>IP: {log.ip}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-4" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Full Audit Log
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
