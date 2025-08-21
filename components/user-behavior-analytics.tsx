"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Users, Clock, MousePointer, Eye, TrendingUp } from "lucide-react"

const userJourneyData = [
  { step: "Landing", users: 10000, conversion: 100 },
  { step: "Search", users: 7500, conversion: 75 },
  { step: "Results", users: 6000, conversion: 60 },
  { step: "Selection", users: 3000, conversion: 30 },
  { step: "Booking", users: 1500, conversion: 15 },
  { step: "Payment", users: 1200, conversion: 12 },
  { step: "Confirmation", users: 1000, conversion: 10 },
]

const deviceData = [
  { device: "Desktop", users: 4500, percentage: 45 },
  { device: "Mobile", users: 4000, percentage: 40 },
  { device: "Tablet", users: 1500, percentage: 15 },
]

const engagementData = [
  { hour: "00", sessions: 120 },
  { hour: "06", sessions: 450 },
  { hour: "12", sessions: 890 },
  { hour: "18", sessions: 1200 },
  { hour: "24", sessions: 340 },
]

const COLORS = ["#0891b2", "#0e7490", "#155e75"]

export function UserBehaviorAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">User Behavior Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Deep insights into user interactions and conversion patterns
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4m 32s</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
              -8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2k</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +18% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10.2%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +2.1% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Journey Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>User Journey Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userJourneyData.map((step, index) => (
                <div key={step.step} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{step.step}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {step.users.toLocaleString()}
                      </span>
                      <Badge variant="outline">{step.conversion}%</Badge>
                    </div>
                  </div>
                  <Progress value={step.conversion} className="h-2" />
                  {index < userJourneyData.length - 1 && (
                    <div className="text-xs text-muted-foreground text-right">
                      -
                      {(
                        ((userJourneyData[index].users - userJourneyData[index + 1].users) /
                          userJourneyData[index].users) *
                        100
                      ).toFixed(1)}
                      % drop-off
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percentage }) => `${device} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="users"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Engagement Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sessions" fill="#0891b2" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
