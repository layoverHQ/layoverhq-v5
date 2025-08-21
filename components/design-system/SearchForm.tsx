"use client"

import React, { useState } from 'react'
import { Calendar, MapPin, Users, Search, ArrowRightLeft, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchFormProps {
  onSearch?: (params: any) => void
  className?: string
  variant?: 'hero' | 'compact'
}

export const SearchForm: React.FC<SearchFormProps> = ({ 
  onSearch, 
  className,
  variant = 'hero' 
}) => {
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [departure, setDeparture] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [cabinClass, setCabinClass] = useState('economy')
  const [showPassengerMenu, setShowPassengerMenu] = useState(false)

  const handleSwapAirports = () => {
    setFrom(to)
    setTo(from)
  }

  const handleSearch = () => {
    onSearch?.({
      tripType,
      from,
      to,
      departure,
      returnDate: tripType === 'roundtrip' ? returnDate : null,
      passengers,
      cabinClass
    })
  }

  const isHero = variant === 'hero'

  return (
    <div className={cn(
      "w-full",
      isHero ? "bg-white rounded-2xl shadow-xl p-8" : "bg-white rounded-lg shadow-md p-4",
      className
    )}>
      {/* Trip Type Selector - Google Flights Style */}
      <div className="flex items-center gap-6 mb-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            value="roundtrip"
            checked={tripType === 'roundtrip'}
            onChange={(e) => setTripType('roundtrip')}
            className="sr-only"
          />
          <span className={cn(
            "px-4 py-2 rounded-full font-medium transition-all",
            tripType === 'roundtrip' 
              ? "bg-primary-100 text-primary-700" 
              : "text-gray-600 hover:bg-gray-100"
          )}>
            Round trip
          </span>
        </label>
        
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            value="oneway"
            checked={tripType === 'oneway'}
            onChange={(e) => setTripType('oneway')}
            className="sr-only"
          />
          <span className={cn(
            "px-4 py-2 rounded-full font-medium transition-all",
            tripType === 'oneway' 
              ? "bg-primary-100 text-primary-700" 
              : "text-gray-600 hover:bg-gray-100"
          )}>
            One way
          </span>
        </label>

        {/* Passenger & Class Selector */}
        <div className="ml-auto relative">
          <button
            onClick={() => setShowPassengerMenu(!showPassengerMenu)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>{passengers} passenger{passengers > 1 ? 's' : ''}</span>
            <span className="text-gray-400">•</span>
            <span className="capitalize">{cabinClass}</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showPassengerMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 z-50">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Passengers</label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Cabin class</label>
                  <select
                    value={cabinClass}
                    onChange={(e) => setCabinClass(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium">Premium Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowPassengerMenu(false)}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Search Fields */}
      <div className={cn(
        "grid gap-4",
        isHero ? "lg:grid-cols-5" : "lg:grid-cols-4"
      )}>
        {/* From Airport */}
        <div className="relative lg:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="From where?"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwapAirports}
          className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors mx-auto my-auto"
          aria-label="Swap airports"
        >
          <ArrowRightLeft className="h-5 w-5 text-gray-600" />
        </button>

        {/* To Airport */}
        <div className="relative lg:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="To where?"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Departure Date */}
        <div className="relative lg:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            placeholder="Departure"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Return Date (conditional) */}
        {tripType === 'roundtrip' && (
          <div className="relative lg:col-span-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              placeholder="Return"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
        )}

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className={cn(
            "flex items-center justify-center gap-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium",
            isHero ? "py-3 px-6 text-base" : "py-3 px-4 text-sm",
            tripType === 'oneway' ? 'lg:col-span-2' : 'lg:col-span-1'
          )}
        >
          <Search className="h-5 w-5" />
          <span>Search flights</span>
        </button>
      </div>

      {/* Quick Links - Hero Only */}
      {isHero && (
        <div className="mt-6 flex items-center gap-6">
          <span className="text-sm text-gray-600">Popular:</span>
          <div className="flex gap-3">
            {['NYC → LON', 'LAX → TOK', 'CHI → PAR', 'SFO → SIN'].map((route) => (
              <button
                key={route}
                onClick={() => {
                  const [origin, dest] = route.split(' → ')
                  setFrom(origin)
                  setTo(dest)
                }}
                className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
              >
                {route}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}