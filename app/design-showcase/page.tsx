"use client"

import React, { useState } from 'react'
import { 
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Select,
  FlightCard,
  Navigation
} from '@/components/design-system'
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  TrendingUp, 
  Shield, 
  Zap,
  Clock,
  ArrowRight,
  Check,
  Globe,
  DollarSign
} from 'lucide-react'

export default function DesignShowcase() {
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('economy')

  const sampleFlight = {
    id: '1',
    airline: 'Emirates',
    route: {
      origin: { code: 'JFK', time: '09:30' },
      destination: { code: 'DXB', time: '14:45' }
    },
    duration: '14h 15m',
    stops: 1,
    layover: {
      city: 'Dubai',
      duration: '8 hours',
      experiences: 12
    },
    price: {
      current: 899,
      original: 1299,
      currency: 'USD'
    },
    rating: 4.8
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation Demo */}
      <Navigation />
      
      <div className="pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-500 text-white">
          <div className="container mx-auto px-4 py-16">
            <h1 className="text-5xl font-bold text-center mb-4">
              LayoverHQ Design System
            </h1>
            <p className="text-xl text-center opacity-90">
              Google Flights & Priceline Inspired Components
            </p>
          </div>
        </div>

        {/* Typography Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Typography</h2>
          <div className="space-y-4 bg-white p-8 rounded-lg border border-gray-200">
            <h1 className="text-5xl font-light">Hero Heading</h1>
            <h2 className="text-3xl font-medium">Section Heading</h2>
            <h3 className="text-2xl font-medium">Subsection Heading</h3>
            <h4 className="text-xl font-medium">Card Title</h4>
            <p className="text-base text-gray-700">Body text - This is how regular paragraph text appears in our design system.</p>
            <p className="text-sm text-gray-600">Small text - Used for secondary information and descriptions.</p>
            <p className="text-xs text-gray-500">Caption text - For timestamps and minor details.</p>
          </div>
        </section>

        {/* Color Palette */}
        <section className="container mx-auto px-4 py-16 bg-gray-50">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Primary Colors */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Primary (Google Blue)</h3>
              <div className="space-y-2">
                <div className="h-16 bg-primary-50 rounded-lg flex items-center justify-center text-sm">50</div>
                <div className="h-16 bg-primary-100 rounded-lg flex items-center justify-center text-sm">100</div>
                <div className="h-16 bg-primary-500 rounded-lg flex items-center justify-center text-white">500</div>
                <div className="h-16 bg-primary-700 rounded-lg flex items-center justify-center text-white">700</div>
                <div className="h-16 bg-primary-900 rounded-lg flex items-center justify-center text-white">900</div>
              </div>
            </div>
            
            {/* Accent Colors */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Accent (Priceline Orange)</h3>
              <div className="space-y-2">
                <div className="h-16 bg-accent-50 rounded-lg flex items-center justify-center text-sm">50</div>
                <div className="h-16 bg-accent-100 rounded-lg flex items-center justify-center text-sm">100</div>
                <div className="h-16 bg-accent-500 rounded-lg flex items-center justify-center text-white">500</div>
                <div className="h-16 bg-accent-700 rounded-lg flex items-center justify-center text-white">700</div>
                <div className="h-16 bg-accent-900 rounded-lg flex items-center justify-center text-white">900</div>
              </div>
            </div>

            {/* Semantic Colors */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Semantic</h3>
              <div className="space-y-2">
                <div className="h-16 bg-success-500 rounded-lg flex items-center justify-center text-white">Success</div>
                <div className="h-16 bg-warning-500 rounded-lg flex items-center justify-center text-gray-900">Warning</div>
                <div className="h-16 bg-error-500 rounded-lg flex items-center justify-center text-white">Error</div>
              </div>
            </div>

            {/* Grays */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Neutral</h3>
              <div className="space-y-2">
                <div className="h-16 bg-gray-100 rounded-lg flex items-center justify-center text-sm">100</div>
                <div className="h-16 bg-gray-300 rounded-lg flex items-center justify-center text-sm">300</div>
                <div className="h-16 bg-gray-500 rounded-lg flex items-center justify-center text-white">500</div>
                <div className="h-16 bg-gray-700 rounded-lg flex items-center justify-center text-white">700</div>
                <div className="h-16 bg-gray-900 rounded-lg flex items-center justify-center text-white">900</div>
              </div>
            </div>
          </div>
        </section>

        {/* Button Components */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Buttons</h2>
          
          <div className="space-y-8">
            {/* Button Variants */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
                <Button variant="success">Success Button</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            {/* Button with Icons */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">With Icons</h3>
              <div className="flex flex-wrap gap-4">
                <Button icon={<Plane className="h-4 w-4" />}>Search Flights</Button>
                <Button variant="secondary" icon={<MapPin className="h-4 w-4" />}>Find Experiences</Button>
                <Button variant="success" icon={<Check className="h-4 w-4" />}>Confirm Booking</Button>
              </div>
            </div>

            {/* Loading State */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">Loading State</h3>
              <div className="flex gap-4">
                <Button isLoading>Loading...</Button>
                <Button variant="secondary" isLoading>Processing...</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Input Components */}
        <section className="container mx-auto px-4 py-16 bg-gray-50">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Form Inputs</h2>
          
          <div className="max-w-2xl space-y-6">
            <Input 
              label="Email Address"
              placeholder="john.doe@example.com"
              hint="We'll never share your email"
            />
            
            <Input 
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<Shield className="h-5 w-5" />}
            />
            
            <Input 
              label="Success Input"
              value="Valid input"
              success
              hint="Great! This looks good"
            />
            
            <Input 
              label="Error Input"
              value="Invalid input"
              error="Please enter a valid value"
            />

            <Select
              label="Travel Class"
              options={[
                { value: 'economy', label: 'Economy' },
                { value: 'premium', label: 'Premium Economy' },
                { value: 'business', label: 'Business' },
                { value: 'first', label: 'First Class' }
              ]}
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              hint="Select your preferred travel class"
            />
          </div>
        </section>

        {/* Badge Components */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Badges</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="accent">Special Offer</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">Sizes</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Card Components */}
        <section className="container mx-auto px-4 py-16 bg-gray-50">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>This is a basic card component</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Card content goes here. You can add any content you want.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Card with shadow elevation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">4.8</span>
                  <span className="text-gray-500">(2,341 reviews)</span>
                </div>
                <p className="text-gray-600">Perfect for highlighting important content.</p>
              </CardContent>
            </Card>

            <Card variant="interactive" onClick={() => alert('Card clicked!')}>
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Click me!</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="accent" className="mb-2">Special</Badge>
                <p className="text-gray-600">This card has hover effects and is clickable.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Flight Card Component */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Flight Card</h2>
          <div className="max-w-3xl mx-auto">
            <FlightCard 
              flight={sampleFlight}
              onSelect={() => alert('Flight selected!')}
            />
          </div>
        </section>

        {/* Responsive Grid Examples */}
        <section className="container mx-auto px-4 py-16 bg-gray-50">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Responsive Grid</h2>
          <p className="text-gray-600 mb-6">Resize your browser to see responsive behavior</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i}>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-2xl font-bold text-primary-600 mb-2">{i}</div>
                    <p className="text-sm text-gray-600">Responsive Grid Item</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Shadows & Elevation */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Shadows & Elevation</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <p className="text-sm font-medium">shadow-sm</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <p className="text-sm font-medium">shadow-default</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <p className="text-sm font-medium">shadow-md</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <p className="text-sm font-medium">shadow-lg</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-xl">
              <p className="text-sm font-medium">shadow-xl</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-2xl">
              <p className="text-sm font-medium">shadow-2xl</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}