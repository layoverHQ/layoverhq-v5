"use client"

import { useState } from "react"
import { EnterpriseButton } from "@/design-system/components/enterprise-button"
import { EnterpriseCard } from "@/design-system/components/enterprise-card"
import { EnterpriseInput } from "@/design-system/components/enterprise-input"
import { Plane, MapPin, Calendar, Users, Star, TrendingUp, Shield, Zap } from "lucide-react"

export default function DesignShowcase() {
  const [inputValue, setInputValue] = useState("")
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
      {/* Hero Section with Morphic Effects */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-orange-600/10 animate-gradient" />
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-orange-600 animate-text-shimmer">
            LayoverHQ Design System
          </h1>
          <p className="text-xl text-center text-gray-600 mb-12">
            Enterprise-Grade Components for Next-Gen Travel
          </p>
        </div>
      </div>

      {/* Button Showcase */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Enterprise Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <EnterpriseButton variant="primary" size="lg">
            <Plane className="mr-2" /> Search Flights
          </EnterpriseButton>
          <EnterpriseButton variant="secondary" size="lg">
            <MapPin className="mr-2" /> Explore Cities
          </EnterpriseButton>
          <EnterpriseButton variant="primary" size="lg">
            <Shield className="mr-2" /> Book Now
          </EnterpriseButton>
          <EnterpriseButton variant="airline" size="lg">
            <Zap className="mr-2" /> Quick Layover
          </EnterpriseButton>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <EnterpriseButton variant="outline" size="md">
            Outline
          </EnterpriseButton>
          <EnterpriseButton variant="ghost" size="md">
            Ghost
          </EnterpriseButton>
          <EnterpriseButton variant="hotel" size="md">
            Hotel
          </EnterpriseButton>
          <EnterpriseButton variant="experience" size="md">
            Experience
          </EnterpriseButton>
          <EnterpriseButton variant="primary" size="sm">
            Small
          </EnterpriseButton>
          <EnterpriseButton variant="primary" size="icon">
            <Star />
          </EnterpriseButton>
        </div>
      </section>

      {/* Card Showcase */}
      <section className="container mx-auto px-4 py-16 bg-white/50 backdrop-blur-sm rounded-3xl">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Enterprise Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EnterpriseCard
            variant="flight"
            className={selectedCard === 1 ? "ring-4 ring-orange-500" : ""}
            onClick={() => setSelectedCard(1)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">NYC → LON</h3>
                <p className="text-gray-600">via Reykjavik</p>
              </div>
              <span className="text-2xl font-bold text-orange-600">$459</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" /> Mar 15
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" /> 2 Adults
              </span>
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900">8-hour layover adventure!</p>
              <p className="text-xs text-gray-600">Explore the Blue Lagoon & Reykjavik</p>
            </div>
          </EnterpriseCard>

          <EnterpriseCard
            variant="experience"
            className={selectedCard === 2 ? "ring-4 ring-orange-500" : ""}
            onClick={() => setSelectedCard(2)}
          >
            <img
              src="/placeholder.jpg"
              alt="Doha Souq"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Desert Safari Adventure</h3>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold">4.9</span>
              <span className="text-sm text-gray-600">(2,341 reviews)</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              4-hour desert experience perfect for Doha layovers
            </p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-orange-600">$89</span>
              <EnterpriseButton variant="experience" size="sm">
                Book Now
              </EnterpriseButton>
            </div>
          </EnterpriseCard>

          <EnterpriseCard
            variant="interactive"
            className={selectedCard === 3 ? "ring-4 ring-orange-500" : ""}
            onClick={() => setSelectedCard(3)}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
                LIMITED TIME
              </span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Save 30% on Layovers</h3>
            <p className="text-gray-600 mb-4">
              Book connecting flights with 6+ hour layovers and unlock exclusive city experiences
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center text-sm">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Free cancellation
              </li>
              <li className="flex items-center text-sm">
                <Zap className="w-4 h-4 mr-2 text-blue-600" />
                Instant booking confirmation
              </li>
            </ul>
            <EnterpriseButton variant="primary" size="md" className="w-full">
              Explore Deals
            </EnterpriseButton>
          </EnterpriseCard>
        </div>
      </section>

      {/* Input Showcase */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Enterprise Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <EnterpriseInput
            variant="default"
            label="Where from?"
            placeholder="New York (JFK)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <EnterpriseInput
            variant="search"
            label="Where to?"
            placeholder="Search airports..."
            value=""
            onChange={() => {}}
          />
          <EnterpriseInput
            variant="date"
            label="Departure"
            type="date"
            value=""
            onChange={() => {}}
          />
          <EnterpriseInput
            variant="default"
            label="Travelers"
            placeholder="2 Adults, 1 Child"
            value=""
            onChange={() => {}}
          />
          <EnterpriseInput
            variant="success"
            label="Promo Code"
            placeholder="SAVE30"
            value="LAYOVER2024"
            onChange={() => {}}
            helpText="Code applied successfully!"
          />
          <EnterpriseInput
            variant="error"
            label="Email"
            type="email"
            placeholder="your@email.com"
            value="invalid-email"
            onChange={() => {}}
            error={true}
            helpText="Please enter a valid email"
          />
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-orange-600 rounded-3xl p-1">
          <div className="bg-white rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-4 text-center">Try Our Smart Layover Search</h2>
            <p className="text-center text-gray-600 mb-8">
              Turn your connection into an adventure with our AI-powered recommendations
            </p>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <EnterpriseInput variant="search" placeholder="From" value="" onChange={() => {}} />
                <EnterpriseInput variant="search" placeholder="To" value="" onChange={() => {}} />
                <EnterpriseInput variant="date" type="date" value="" onChange={() => {}} />
                <EnterpriseButton variant="airline" size="lg" className="h-full">
                  Search
                </EnterpriseButton>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  6+ hour layovers
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  City tours included
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  Save up to 40%
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  VIP lounge access
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animation Showcase */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Morphic Interactions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group cursor-pointer">
            <div className="p-6 bg-white rounded-2xl shadow-lg transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-orange-50">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg mb-4 transition-transform duration-700 group-hover:rotate-180" />
              <h3 className="text-xl font-bold mb-2">Smooth Transitions</h3>
              <p className="text-gray-600">Hover to see the magic</p>
            </div>
          </div>
          <div className="group cursor-pointer">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-orange-600 rounded-2xl shadow-lg transition-all duration-500 group-hover:shadow-2xl">
              <div className="bg-white rounded-xl p-4 transition-transform duration-500 group-hover:scale-95">
                <h3 className="text-xl font-bold mb-2">Inverted Effects</h3>
                <p className="text-gray-600">Professional animations</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <div className="p-6 bg-white shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-600 transform translate-y-full transition-transform duration-500 hover:translate-y-0" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Slide Effects</h3>
                <p className="text-gray-600">Engaging interactions</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
