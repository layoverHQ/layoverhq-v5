export interface TravelDocument {
  id: string
  type: 'passport' | 'visa' | 'boarding_pass' | 'hotel_reservation' | 'insurance' | 'vaccination_certificate'
  documentNumber?: string
  issuedBy?: string
  validUntil?: string
  attachmentUrl?: string
  notes?: string
}

export interface TravelAlert {
  id: string
  type: 'delay' | 'cancellation' | 'gate_change' | 'weather' | 'rebooking_suggestion' | 'document_reminder'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  actionRequired: boolean
  actionUrl?: string
  timestamp: string
  acknowledged: boolean
}

export interface FlightBooking {
  id: string
  confirmationCode: string
  airline: string
  flightNumber: string
  departure: {
    airport: string
    city: string
    country: string
    terminal?: string
    gate?: string
    time: string
    localTime: string
    timezone: string
  }
  arrival: {
    airport: string
    city: string
    country: string
    terminal?: string
    gate?: string
    time: string
    localTime: string
    timezone: string
  }
  duration: number
  status: 'scheduled' | 'delayed' | 'cancelled' | 'boarding' | 'departed' | 'arrived'
  seatNumber?: string
  checkedIn: boolean
  boardingPass?: string
  baggage?: {
    checkedBags: number
    carryOnBags: number
    trackingNumbers: string[]
  }
  lastUpdated: string
}

export interface AccommodationBooking {
  id: string
  confirmationCode: string
  name: string
  address: string
  city: string
  country: string
  checkIn: string
  checkOut: string
  roomType: string
  guestCount: number
  totalPrice: number
  currency: string
  phoneNumber?: string
  coordinates?: {
    lat: number
    lng: number
  }
  amenities: string[]
  cancellationPolicy?: string
}

export interface ActivityBooking {
  id: string
  confirmationCode?: string
  title: string
  description: string
  datetime: string
  duration: number
  location: {
    name: string
    address: string
    city: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  price: number
  currency: string
  category: 'tour' | 'activity' | 'dining' | 'transport' | 'entertainment'
  provider: string
  status: 'confirmed' | 'pending' | 'cancelled'
  participantCount: number
  meetingPoint?: string
  contactInfo?: string
}

export interface TransportBooking {
  id: string
  confirmationCode?: string
  type: 'taxi' | 'train' | 'bus' | 'car_rental' | 'metro' | 'uber' | 'lyft'
  from: string
  to: string
  datetime: string
  duration?: number
  price?: number
  currency?: string
  provider: string
  ticketInfo?: string
  seatNumber?: string
}

export interface LayoverPlan {
  id: string
  airport: string
  city: string
  country: string
  arrivalTime: string
  departureTime: string
  totalDuration: number
  explorationTime: number
  minimumConnectionTime: number
  transportToCity?: TransportBooking
  transportFromCity?: TransportBooking
  activities: ActivityBooking[]
  dining?: ActivityBooking[]
  safetyRating: number
  weatherForecast?: {
    temperature: number
    condition: string
    precipitation: number
  }
  visaRequired: boolean
  estimatedCost: {
    transport: number
    activities: number
    dining: number
    total: number
    currency: string
  }
  riskLevel: 'low' | 'medium' | 'high'
  contingencyPlans: string[]
}

export interface TripSegment {
  id: string
  segmentNumber: number
  type: 'flight' | 'layover' | 'accommodation' | 'local_activity'
  startTime: string
  endTime: string
  location: {
    airport?: string
    city: string
    country: string
  }
  booking?: FlightBooking | AccommodationBooking | ActivityBooking
  layoverPlan?: LayoverPlan
  notes?: string
  status: 'upcoming' | 'active' | 'completed' | 'cancelled' | 'delayed'
}

export interface Itinerary {
  id: string
  userId: string
  title: string
  description?: string
  startDate: string
  endDate: string
  totalDuration: number
  status: 'draft' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  tripType: 'business' | 'leisure' | 'mixed'
  travelerCount: number
  budget?: {
    total: number
    spent: number
    currency: string
    breakdown: {
      flights: number
      accommodation: number
      activities: number
      transport: number
      dining: number
      misc: number
    }
  }
  segments: TripSegment[]
  documents: TravelDocument[]
  alerts: TravelAlert[]
  preferences: {
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
      advanceNotice: number
    }
    rebookingPreferences: {
      automaticRebooking: boolean
      maxPriceIncrease: number
      preferredAirlines: string[]
      flexibleDates: boolean
      flexibleAirports: boolean
    }
  }
  emergencyContacts: {
    name: string
    relationship: string
    phone: string
    email?: string
  }[]
  createdAt: string
  updatedAt: string
  lastSyncedAt: string
}

export interface RebookingOption {
  id: string
  originalFlightId: string
  newFlights: FlightBooking[]
  reason: 'cancellation' | 'delay' | 'missed_connection' | 'schedule_change'
  impact: {
    arrivalTimeChange: number
    costDifference: number
    layoverChanges: LayoverPlan[]
    accommodationChanges: AccommodationBooking[]
    activityChanges: ActivityBooking[]
  }
  recommendation: 'accept' | 'decline' | 'manual_review'
  confidence: number
  validUntil: string
  actionRequired: boolean
}

export interface ItineraryStats {
  totalTrips: number
  completedTrips: number
  totalDistance: number
  totalSavings: number
  favoriteCities: string[]
  averageTripDuration: number
  upcomingTrips: number
}

export interface SyncStatus {
  lastSync: string
  status: 'synced' | 'syncing' | 'error' | 'outdated'
  errors: string[]
  nextSync: string
  syncSources: {
    airlines: string[]
    hotels: string[]
    activities: string[]
    weather: boolean
    alerts: boolean
  }
}