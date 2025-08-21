"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Target, AlertTriangle, CheckCircle } from "lucide-react"

interface ForecastData {
  month: string
  actual?: number
  predicted: number
  confidence: number
  target: number
}

const mockForecastData: ForecastData[] = [
  { month: "Jan", actual: 180000, predicted: 175000, confidence: 95, target: 200000 },
  { month: "Feb", actual: 220000, predicted: 215000, confidence: 92, target: 230000 },
  { month: "Mar", actual: 285000, predicted: 280000, confidence: 89, target: 290000 },
  { month: "Apr", actual: 310000, predicted: 305000, confidence: 87, target: 320000 },
  { month: "May", actual: 340000, predicted: 335000, confidence: 85, target: 350000 },
  { month: "Jun", actual: 385000, predicted: 380000, confidence: 83, target: 400000 },
  { month: "Jul", predicted: 420000, confidence: 78, target: 450000 },
  { month: "Aug", predicted: 465000, confidence: 75, target: 480000 },
  { month: "Sep", predicted: 510000, confidence: 72, target: 520000 },
  { month: "Oct", predicted: 545000, confidence: 70, target: 560000 },
  { month: "Nov", predicted: 580000, confidence: 68, target: 600000 },
  { month: "Dec", predicted: 625000, confidence: 65, target: 650000 },
]

export function RevenueForecastingPanel() {
  const [forecastPeriod, setForecastPeriod] = useState("6m")
  const [model, setModel] = useState("ml")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const currentMonth = mockForecastData.find((d) => d.month === "Jun")
  const nextMonth = mockForecastData.find((d) => d.month === "Jul")
  const yearEndForecast = mockForecastData.find((d) => d.month === "Dec")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Revenue Forecasting</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered revenue predictions and targets
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ml">ML Model</SelectItem>
              <SelectItem value="linear">Linear Trend</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="12m">12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Month Forecast</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(nextMonth?.predicted || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
              {nextMonth?.confidence}% confidence
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year-End Projection</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(yearEndForecast?.predicted || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
              {yearEndForecast?.confidence}% confidence
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Achievement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonth ? Math.round((currentMonth.actual! / currentMonth.target) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Current month vs target</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast vs Actuals</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={mockForecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip formatter={(value) => [formatCurrency(value as number)]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#0891b2"
                strokeWidth={3}
                name="Actual Revenue"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted Revenue"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#ef4444"
                strokeWidth={1}
                name="Target Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
