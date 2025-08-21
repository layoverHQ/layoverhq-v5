"use client"

import React from 'react'
import { ArrowRight, Clock, Plane, Star, Users, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlightCardProps {
  flight: {
    id: string
    airline: string
    route: {
      origin: { code: string; time: string }
      destination: { code: string; time: string }
    }
    duration: string
    stops: number
    layover?: {
      city: string
      duration: string
      experiences: number
    }
    price: {
      current: number
      original?: number
      currency: string
    }
    rating?: number
  }
  onSelect?: () => void
  className?: string
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, onSelect, className }) => {
  const savings = flight.price.original 
    ? flight.price.original - flight.price.current 
    : 0

  return (
    <div 
      className={cn(
        "bg-white rounded-lg border border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group",
        className
      )}
      onClick={onSelect}
    >
      {/* Price Header - Priceline Style */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-primary-700">
                  ${flight.price.current}
                </span>
                {flight.price.original && (
                  <span className="text-lg text-gray-500 line-through">
                    ${flight.price.original}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Save ${savings}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {flight.rating && (
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full">
              <Star className="h-4 w-4 text-amber-400 fill-current" />
              <span className="text-sm font-medium">{flight.rating}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Flight Route - Google Flights Style */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              {/* Origin */}
              <div className="text-center">
                <div className="text-2xl font-medium text-gray-900">
                  {flight.route.origin.code}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {flight.route.origin.time}
                </div>
              </div>

              {/* Flight Path Visualization */}
              <div className="flex-1 relative">
                <div className="border-t-2 border-dashed border-gray-300"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{flight.duration}</span>
                    {flight.stops > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span>{flight.stops} stop{flight.stops > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
                <Plane className="absolute top-1/2 right-0 transform -translate-y-1/2 h-5 w-5 text-primary-600" />
              </div>

              {/* Destination */}
              <div className="text-center">
                <div className="text-2xl font-medium text-gray-900">
                  {flight.route.destination.code}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {flight.route.destination.time}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layover Highlight */}
        {flight.layover && (
          <div className="bg-gradient-to-r from-accent-50 to-orange-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full">
                  <Clock className="h-5 w-5 text-accent-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {flight.layover.duration} layover in {flight.layover.city}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {flight.layover.experiences} experiences available
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-accent-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Airline & Quick Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">by</span>
            <span className="text-sm font-medium text-gray-900">{flight.airline}</span>
          </div>
          
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
            Select Flight
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}