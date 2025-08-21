"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import FunctionalHeroSearch from "@/components/functional-hero-search";
import FunctionalHeroCTA from "@/components/functional-hero-cta";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Star,
  Menu,
  X,
  Plane,
  TrendingUp,
  Users,
  ArrowRight,
  Shield,
  Hotel,
  Car,
  ChevronRight,
  Play,
  Globe,
  Award,
  CheckCircle2,
  FileText,
} from "lucide-react";

export default function TravelOTALandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const destinationsByRegion = {
    us: [
      {
        city: "New York",
        country: "United States",
        image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
        price: "from $879",
        layover: "8h 45m",
        rating: 4.8,
        reviews: 1240,
      },
      {
        city: "Chicago", 
        country: "United States",
        image: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=600&q=80",
        price: "from $649",
        layover: "12h 15m", 
        rating: 4.9,
        reviews: 890,
      },
      {
        city: "Dallas",
        country: "United States", 
        image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&q=80",
        price: "from $599",
        layover: "9h 30m",
        rating: 4.7,
        reviews: 650,
      },
      {
        city: "Los Angeles",
        country: "United States",
        image: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=600&q=80", 
        price: "from $729",
        layover: "6h 20m",
        rating: 4.6,
        reviews: 1100,
      },
    ],
    latam: [
      {
        city: "São Paulo",
        country: "Brazil",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
        price: "from $524",
        layover: "10h 30m",
        rating: 4.5,
        reviews: 780,
      },
      {
        city: "Mexico City",
        country: "Mexico",
        image: "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600&q=80",
        price: "from $445",
        layover: "7h 15m",
        rating: 4.6,
        reviews: 920,
      },
      {
        city: "Lima",
        country: "Peru",
        image: "https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=600&q=80",
        price: "from $389",
        layover: "8h 20m",
        rating: 4.4,
        reviews: 560,
      },
      {
        city: "Buenos Aires",
        country: "Argentina",
        image: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&q=80",
        price: "from $567",
        layover: "11h 45m",
        rating: 4.7,
        reviews: 840,
      },
    ],
    europe: [
      {
        city: "London",
        country: "United Kingdom",
        image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80",
        price: "from $789",
        layover: "9h 15m",
        rating: 4.8,
        reviews: 1560,
      },
      {
        city: "Paris",
        country: "France",
        image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&q=80",
        price: "from $845",
        layover: "8h 30m",
        rating: 4.9,
        reviews: 1890,
      },
      {
        city: "Amsterdam",
        country: "Netherlands",
        image: "https://images.unsplash.com/photo-1459679749680-18eb1eb37418?w=600&q=80",
        price: "from $695",
        layover: "7h 45m",
        rating: 4.7,
        reviews: 1240,
      },
      {
        city: "Frankfurt",
        country: "Germany",
        image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80",
        price: "from $629",
        layover: "6h 20m",
        rating: 4.5,
        reviews: 890,
      },
    ],
    africa: [
      {
        city: "Cairo",
        country: "Egypt",
        image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73dc4?w=600&q=80",
        price: "from $434",
        layover: "12h 30m",
        rating: 4.3,
        reviews: 670,
      },
      {
        city: "Cape Town",
        country: "South Africa",
        image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&q=80",
        price: "from $789",
        layover: "10h 15m",
        rating: 4.8,
        reviews: 1120,
      },
      {
        city: "Nairobi",
        country: "Kenya",
        image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80",
        price: "from $512",
        layover: "9h 45m",
        rating: 4.4,
        reviews: 580,
      },
      {
        city: "Marrakech",
        country: "Morocco",
        image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73dc4?w=600&q=80",
        price: "from $398",
        layover: "8h 10m",
        rating: 4.6,
        reviews: 750,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Travel OTA Style */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-sm"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/brand/layoverhq-logo-correct.svg"
                alt="LayoverHQ Logo"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <span className="font-bold text-2xl text-gray-900">LayoverHQ</span>
            </Link>

            <div className="hidden lg:flex items-center space-x-8">
              <Link href="/search" className="text-gray-700 hover:text-blue-600 font-medium flex items-center">
                <Plane className="h-4 w-4 mr-1" />
                Flights
              </Link>
              <Link href="/experiences" className="text-gray-700 hover:text-blue-600 font-medium flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Experiences
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                Dashboard
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-blue-600 font-medium">
                Admin
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-700 hover:text-blue-600 font-medium">
                Sign In
              </Link>
              <Link href="/auth/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Register
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Sophisticated & Minimal */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Single Premium Background */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=90"
            alt="Airport Terminal"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/70 to-slate-900/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          {/* Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-left">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full mb-8 text-sm font-medium">
                <Clock className="h-4 w-4 mr-2" />
                Used by travelers in 200+ cities
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-white mb-8 leading-tight">
                <span className="block font-normal">Stop wasting</span>
                <span className="block font-bold text-white">
                  layover time
                </span>
              </h1>
              
              <p className="text-lg text-slate-200 mb-10 leading-relaxed max-w-lg">
                Got 4+ hours between flights? We'll show you what to do in the city instead of sitting in the airport.
              </p>


              {/* CTA Buttons - Functional */}
              <FunctionalHeroCTA />
              
              {/* Premium Features Preview */}
              <div className="mt-12 grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-center">
                  <Clock className="h-6 w-6 text-white mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">Smart Timing Engine</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-center">
                  <Star className="h-6 w-6 text-white mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">Expert Curation</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 text-center">
                  <Shield className="h-6 w-6 text-white mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">Safety Guarantee</p>
                </div>
              </div>
            </div>

            {/* Right Content - Functional Search */}
            <div>
              <FunctionalHeroSearch />
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions - Enhanced */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-slate-900 mb-3">
              Why travelers use us
            </h2>
            <p className="text-slate-600">
              Because airport food courts get old after hour 3
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-red-200 transition-colors">
                <Clock className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-3">You won't miss your flight</h3>
              <p className="text-slate-600 leading-relaxed">We build in buffer time so you're back at the gate relaxed, not sprinting through security.</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <MapPin className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-3">Locals pick the spots</h3>
              <p className="text-slate-600 leading-relaxed">No tourist traps. Our city guides live there and know what's actually worth your time.</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <Car className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-3">Transport included</h3>
              <p className="text-slate-600 leading-relaxed">Airport pickup, city transport, luggage storage - we handle the logistics so you just enjoy.</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/search" 
              className="inline-flex items-center bg-slate-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-slate-800 transition-colors text-lg"
            >
              See what's available
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - New Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-900 mb-4">
              How it works
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Three steps and you're exploring instead of waiting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-blue-600" />
                <div className="absolute -mt-8 -ml-8 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Tell us your flights</h3>
              <p className="text-slate-600 leading-relaxed">Send us your layover city and how long you've got - we'll see what's possible</p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-purple-600" />
                <div className="absolute -mt-8 -ml-8 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Pick what looks good</h3>
              <p className="text-slate-600 leading-relaxed">We'll show you a few options that fit your timing - quick city tour, local food, whatever you're into</p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane className="h-12 w-12 text-green-600" />
                <div className="absolute -mt-8 -ml-8 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Go do it</h3>
              <p className="text-slate-600 leading-relaxed">Meet your guide, see the city, get back to the airport with time to spare</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/search" 
              className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg"
            >
              Try it out
              <Play className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Destinations - Sophisticated Minimal */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-900 mb-4">
              Popular Layover Destinations
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Available in 200+ airports worldwide - your next adventure awaits
            </p>
          </div>

          {/* United States */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <h3 className="text-lg font-medium text-slate-900 mr-4">United States</h3>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {destinationsByRegion.us.map((destination, index) => (
                <div key={index} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-300 overflow-hidden group cursor-pointer hover:shadow-lg">
                  <div className="relative h-48">
                    <Image
                      src={destination.image}
                      alt={destination.city}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1 rounded-md shadow-sm">
                      <span className="text-sm font-medium">{destination.price}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-lg text-white mb-1">{destination.city}</h3>
                      <p className="text-white/80 text-sm">{destination.country}</p>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-400 fill-current" />
                        <span className="text-sm font-medium text-slate-700 ml-1">{destination.rating}</span>
                        <span className="text-xs text-slate-500 ml-1">({destination.reviews.toLocaleString()})</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{destination.layover}</span>
                      </div>
                    </div>
                    
                    <Link href={`/experiences?city=${encodeURIComponent(destination.city)}`} className="text-slate-900 hover:text-slate-700 font-medium text-sm flex items-center group">
                      Explore Experiences
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* South America & LATAM */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <h3 className="text-lg font-medium text-slate-900 mr-4">South America & LATAM</h3>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {destinationsByRegion.latam.map((destination, index) => (
                <div key={index} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-300 overflow-hidden group cursor-pointer hover:shadow-lg">
                  <div className="relative h-48">
                    <Image
                      src={destination.image}
                      alt={destination.city}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1 rounded-md shadow-sm">
                      <span className="text-sm font-medium">{destination.price}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-lg text-white mb-1">{destination.city}</h3>
                      <p className="text-white/80 text-sm">{destination.country}</p>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-400 fill-current" />
                        <span className="text-sm font-medium text-slate-700 ml-1">{destination.rating}</span>
                        <span className="text-xs text-slate-500 ml-1">({destination.reviews.toLocaleString()})</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{destination.layover}</span>
                      </div>
                    </div>
                    
                    <Link href={`/experiences?city=${encodeURIComponent(destination.city)}`} className="text-slate-900 hover:text-slate-700 font-medium text-sm flex items-center group">
                      Explore Experiences
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Europe */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <h3 className="text-lg font-medium text-slate-900 mr-4">Europe</h3>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {destinationsByRegion.europe.map((destination, index) => (
                <div key={index} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-300 overflow-hidden group cursor-pointer hover:shadow-lg">
                  <div className="relative h-48">
                    <Image
                      src={destination.image}
                      alt={destination.city}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1 rounded-md shadow-sm">
                      <span className="text-sm font-medium">{destination.price}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-lg text-white mb-1">{destination.city}</h3>
                      <p className="text-white/80 text-sm">{destination.country}</p>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-400 fill-current" />
                        <span className="text-sm font-medium text-slate-700 ml-1">{destination.rating}</span>
                        <span className="text-xs text-slate-500 ml-1">({destination.reviews.toLocaleString()})</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{destination.layover}</span>
                      </div>
                    </div>
                    
                    <Link href={`/experiences?city=${encodeURIComponent(destination.city)}`} className="text-slate-900 hover:text-slate-700 font-medium text-sm flex items-center group">
                      Explore Experiences
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Africa */}
          <div className="mb-8">
            <div className="flex items-center mb-8">
              <h3 className="text-lg font-medium text-slate-900 mr-4">Africa</h3>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {destinationsByRegion.africa.map((destination, index) => (
                <div key={index} className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-300 overflow-hidden group cursor-pointer hover:shadow-lg">
                  <div className="relative h-48">
                    <Image
                      src={destination.image}
                      alt={destination.city}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1 rounded-md shadow-sm">
                      <span className="text-sm font-medium">{destination.price}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-lg text-white mb-1">{destination.city}</h3>
                      <p className="text-white/80 text-sm">{destination.country}</p>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-400 fill-current" />
                        <span className="text-sm font-medium text-slate-700 ml-1">{destination.rating}</span>
                        <span className="text-xs text-slate-500 ml-1">({destination.reviews.toLocaleString()})</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{destination.layover}</span>
                      </div>
                    </div>
                    
                    <Link href={`/experiences?city=${encodeURIComponent(destination.city)}`} className="text-slate-900 hover:text-slate-700 font-medium text-sm flex items-center group">
                      Explore Experiences
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Enhanced with New Copy */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-900 mb-4">
              How we make it work
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              The practical stuff that makes layover tours actually doable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">We do the math on timing</h3>
              <p className="text-slate-600">Immigration lines, transport time, getting back through security - we factor it all in so you don't stress</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Locals know what's good</h3>
              <p className="text-slate-600">Our guides live in these cities and actually know the best spots, not just the famous ones</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">We watch your flight</h3>
              <p className="text-slate-600">If your flight gets delayed or changed, we adjust everything automatically - no scrambling</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <Hotel className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Leave your bags behind</h3>
              <p className="text-slate-600">We can store your carry-on or arrange checked bag transfers so you're not dragging luggage around the city</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Solo or with others</h3>
              <p className="text-slate-600">Go alone if you want, or we can match you with other travelers on the same layover</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-slate-200 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Plane className="h-6 w-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Works on your phone</h3>
              <p className="text-slate-600">All the info you need works offline because airport wifi is usually garbage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Experiences - Sophisticated Minimal */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-light text-slate-900 mb-2">Featured Experiences</h2>
              <p className="text-slate-600">Curated layover adventures from our travel experts</p>
            </div>
            <Link href="/deals" className="text-slate-900 hover:text-slate-700 font-medium flex items-center group">
              View all experiences
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Featured Experience */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="absolute inset-0">
                <Image
                  src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80"
                  alt="NYC Skyline"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-slate-900/40" />
              </div>
              <div className="relative p-8 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-md text-sm font-medium">
                    Featured Experience
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-md text-xs font-medium">
                    8+ hours
                  </div>
                </div>
                <h3 className="text-3xl font-light mb-3">NYC in 8 hours</h3>
                <p className="text-white/80 mb-6 text-lg leading-relaxed">Helicopter ride over Manhattan, walk through Central Park, grab lunch in Times Square. Transport included.</p>
                <div className="flex items-center space-x-6 mb-8">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-amber-400 fill-current" />
                    <span className="ml-2 font-medium">4.8 (1,240)</span>
                  </div>
                  <div className="flex items-center font-medium">
                    <Clock className="h-4 w-4 mr-2" />
                    8-12 hours
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white/60 line-through text-lg">$1,249</span>
                    <span className="text-3xl font-light ml-3">$879</span>
                    <div className="text-white/80 text-sm mt-1">Save $370</div>
                  </div>
                  <Link href="/booking?experience=nyc-explorer" className="bg-white text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-slate-100 transition-all duration-300 inline-block text-center">
                    Book Experience
                  </Link>
                </div>
              </div>
            </div>

            {/* Side Experiences */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg hover:shadow-lg transition-all duration-300 group overflow-hidden">
                <div className="relative h-32">
                  <Image
                    src="https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=400&q=80"
                    alt="Chicago"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 px-2 py-1 rounded text-xs font-medium">
                    12h layover
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">Chicago highlights</h4>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">Save $318</span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">Architecture boat tour, walk the Bean, authentic deep dish pizza</p>
                  <div className="flex items-center mb-4">
                    <Star className="h-4 w-4 text-amber-400 fill-current" />
                    <span className="text-sm font-medium text-slate-700 ml-1">4.9 (890)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 line-through text-sm">$967</span>
                      <span className="text-xl font-medium text-slate-900 ml-2">$649</span>
                    </div>
                    <Link href="/booking?experience=chicago-architecture" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-block text-center">
                      Book
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg hover:shadow-lg transition-all duration-300 group overflow-hidden">
                <div className="relative h-32">
                  <Image
                    src="https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&q=80"
                    alt="Dallas"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-900 px-2 py-1 rounded text-xs font-medium">
                    9h layover
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">Dallas food tour</h4>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">Save $235</span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">Historic Stockyards, best BBQ joints, downtown sights</p>
                  <div className="flex items-center mb-4">
                    <Star className="h-4 w-4 text-amber-400 fill-current" />
                    <span className="text-sm font-medium text-slate-700 ml-1">4.7 (650)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 line-through text-sm">$834</span>
                      <span className="text-xl font-medium text-slate-900 ml-2">$599</span>
                    </div>
                    <Link href="/booking?experience=dallas-bbq" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-block text-center">
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Testimonials - Enhanced */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-slate-900 mb-4">
              What people say
            </h2>
            <p className="text-slate-600">
              From actual travelers who've done this
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-lg p-8 border border-slate-200">
              <div className="flex mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "Had 8 hours in Paris between flights to Tokyo. Instead of sleeping on airport chairs, I saw the Eiffel Tower and ate actual French food. Got back with an hour to spare."
              </p>
              <div className="flex items-center">
                <Image
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
                  alt="Sarah K."
                  width={48}
                  height={48}
                  className="rounded-full mr-3"
                />
                <div>
                  <div className="font-medium text-slate-900">Sarah K.</div>
                  <div className="text-slate-600 text-sm">Designer from Portland</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-8 border border-slate-200">
              <div className="flex mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "My company books weird connecting flights to save money. This made my 10-hour Chicago layover actually enjoyable. Did the architecture boat tour and deep dish pizza."
              </p>
              <div className="flex items-center">
                <Image
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80"
                  alt="Marcus T."
                  width={48}
                  height={48}
                  className="rounded-full mr-3"
                />
                <div>
                  <div className="font-medium text-slate-900">Marcus T.</div>
                  <div className="text-slate-600 text-sm">Travels for work</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-8 border border-slate-200">
              <div className="flex mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "Had a 12-hour overnight layover in Frankfurt. Thought I'd just sleep in the airport, but they got me a walking tour and dinner in the old town. Way better than airport food."
              </p>
              <div className="flex items-center">
                <Image
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80"
                  alt="Priya M."
                  width={48}
                  height={48}
                  className="rounded-full mr-3"
                />
                <div>
                  <div className="font-medium text-slate-900">Priya M.</div>
                  <div className="text-slate-600 text-sm">Flies a lot for consulting</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Compelling */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-light text-white mb-4">
            Got a layover coming up?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Stop wasting time in airports. Let's see what you can do in the city instead.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              href="/search" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg inline-flex items-center justify-center"
            >
              Check your options
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link 
              href="/experiences" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-lg inline-flex items-center justify-center"
            >
              See what others did
              <Globe className="h-5 w-5 ml-2" />
            </Link>
          </div>
          <p className="text-blue-200 text-sm">
            We work in most major airports
          </p>
        </div>
      </section>

      {/* Trust Indicators - Minimal */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-slate-500 text-sm font-medium">Trusted by leading airlines worldwide</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 mb-12">
            <div className="text-xl font-light text-slate-400">American Airlines</div>
            <div className="text-xl font-light text-slate-400">Delta</div>
            <div className="text-xl font-light text-slate-400">United</div>
            <div className="text-xl font-light text-slate-400">Southwest</div>
            <div className="text-xl font-light text-slate-400">JetBlue</div>
          </div>
          <div className="flex justify-center items-center gap-8">
            <div className="flex items-center text-slate-600">
              <Shield className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Secure Booking</span>
            </div>
            <div className="flex items-center text-slate-600">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">IATA Certified</span>
            </div>
            <div className="flex items-center text-slate-600">
              <Award className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Award Winning</span>
            </div>
          </div>
        </div>
      </section>


      {/* Footer - Premium Minimal */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Image
                  src="/brand/layoverhq-logo-correct.svg"
                  alt="LayoverHQ Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="font-medium text-xl">LayoverHQ</span>
              </div>
              <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
                Layovers don't have to suck. We help travelers make the most of connection time by exploring cities instead of sitting in airports.
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-sm">
                  <Star className="h-4 w-4 text-amber-400 fill-current mr-2" />
                  <span className="text-slate-300">4.9 rating</span>
                </div>
                <div className="text-sm text-slate-400">750K+ adventures</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-6 text-slate-200">Services</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-slate-200 transition-colors">Layover Experiences</Link></li>
                <li><Link href="#" className="hover:text-slate-200 transition-colors">City Tours</Link></li>
                <li><Link href="#" className="hover:text-slate-200 transition-colors">Airport Transfers</Link></li>
                <li><Link href="#" className="hover:text-slate-200 transition-colors">Custom Packages</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-6 text-slate-200">Company</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="#" className="hover:text-slate-200 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-slate-200 transition-colors">Support</Link></li>
                <li><Link href="#" className="hover:text-slate-200 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-slate-200 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              © 2024 LayoverHQ. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-slate-500 text-xs">Made for travelers, by travelers</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}