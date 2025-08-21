"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Plane, Clock, MapPin } from "lucide-react"

// Mock flight data
const mockFlights = [
  {
    id: "FL001",
    airline: "Qatar Airways",
    route: "NYC → DOH → SIN",
    departure: "2024-01-15 14:30",
    arrival: "2024-01-16 22:45",
    layoverDuration: "8h 30m",
    layoverCity: "Doha",
    price: 1250,
    status: "active",
    bookings: 45,
  },
  {
    id: "FL002",
    airline: "Emirates",
    route: "LAX → DXB → BKK",
    departure: "2024-01-15 23:15",
    arrival: "2024-01-17 18:20",
    layoverDuration: "12h 15m",
    layoverCity: "Dubai",
    price: 1180,
    status: "active",
    bookings: 32,
  },
  {
    id: "FL003",
    airline: "Turkish Airlines",
    route: "JFK → IST → DEL",
    departure: "2024-01-16 08:45",
    arrival: "2024-01-17 14:30",
    layoverDuration: "6h 45m",
    layoverCity: "Istanbul",
    price: 980,
    status: "delayed",
    bookings: 28,
  },
  {
    id: "FL004",
    airline: "Singapore Airlines",
    route: "SFO → SIN → SYD",
    departure: "2024-01-16 16:20",
    arrival: "2024-01-18 09:15",
    layoverDuration: "10h 30m",
    layoverCity: "Singapore",
    price: 1420,
    status: "active",
    bookings: 51,
  },
]

export function FlightsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredFlights = mockFlights.filter((flight) => {
    const matchesSearch =
      flight.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || flight.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "delayed":
        return <Badge variant="destructive">Delayed</Badge>
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Flight Management</h2>
          <p className="text-muted-foreground">Manage flight routes and layover packages</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Flight Route
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flights by route, airline, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === "all" ? "default" : "outline"}
                onClick={() => setSelectedStatus("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={selectedStatus === "active" ? "default" : "outline"}
                onClick={() => setSelectedStatus("active")}
                size="sm"
              >
                Active
              </Button>
              <Button
                variant={selectedStatus === "delayed" ? "default" : "outline"}
                onClick={() => setSelectedStatus("delayed")}
                size="sm"
              >
                Delayed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flights Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5" />
            <span>Flight Routes ({filteredFlights.length})</span>
          </CardTitle>
          <CardDescription>
            Manage and monitor all flight routes with layover opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flight ID</TableHead>
                <TableHead>Airline</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Layover</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlights.map((flight) => (
                <TableRow key={flight.id}>
                  <TableCell className="font-medium">{flight.id}</TableCell>
                  <TableCell>{flight.airline}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{flight.route}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{flight.layoverCity}</div>
                      <div className="text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {flight.layoverDuration}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(flight.departure).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {new Date(flight.departure).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${flight.price}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{flight.bookings}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(flight.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
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
    </div>
  )
}
