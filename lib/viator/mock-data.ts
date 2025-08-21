// Mock data for Viator experiences - to be used when API is unavailable
export const mockViatorExperiences = {
  Dubai: [
    {
      productCode: "VTR-DXB-001",
      title: "Dubai Desert Safari with BBQ Dinner",
      description:
        "Experience the thrill of dune bashing followed by a traditional BBQ dinner under the stars. Perfect for a layover adventure.",
      duration: "6 hours",
      price: {
        amount: 65.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Desert Safari Experience",
        },
      ],
      rating: 4.8,
      reviewCount: 2341,
      location: {
        city: "Dubai",
        country: "United Arab Emirates",
      },
      highlights: ["Dune Bashing", "Camel Riding", "BBQ Dinner", "Belly Dancing Show"],
    },
    {
      productCode: "VTR-DXB-002",
      title: "Burj Khalifa: At the Top Admission Ticket",
      description:
        "Skip the line and ascend to the 124th & 125th floors of the world's tallest building. Ideal for short layovers.",
      duration: "2 hours",
      price: {
        amount: 45.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Burj Khalifa View",
        },
      ],
      rating: 4.7,
      reviewCount: 5432,
      location: {
        city: "Dubai",
        country: "United Arab Emirates",
      },
      highlights: [
        "Skip-the-line Access",
        "124th Floor Observatory",
        "Multimedia Presentation",
        "Telescope Views",
      ],
    },
    {
      productCode: "VTR-DXB-003",
      title: "Dubai Mall & Fountain Show Walking Tour",
      description:
        "Explore the world's largest mall and witness the spectacular fountain show. Great for evening layovers.",
      duration: "3 hours",
      price: {
        amount: 25.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Dubai Fountain Show",
        },
      ],
      rating: 4.5,
      reviewCount: 876,
      location: {
        city: "Dubai",
        country: "United Arab Emirates",
      },
      highlights: ["Dubai Mall Tour", "Fountain Show", "Aquarium Views", "Shopping Time"],
    },
  ],
  Istanbul: [
    {
      productCode: "VTR-IST-001",
      title: "Istanbul Layover Tour: Hagia Sophia & Blue Mosque",
      description:
        "Make the most of your layover with a guided tour of Istanbul's iconic landmarks including Hagia Sophia and Blue Mosque.",
      duration: "5 hours",
      price: {
        amount: 55.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Hagia Sophia",
        },
      ],
      rating: 4.9,
      reviewCount: 3245,
      location: {
        city: "Istanbul",
        country: "Turkey",
      },
      highlights: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar", "Airport Transfer Included"],
    },
    {
      productCode: "VTR-IST-002",
      title: "Bosphorus Express Cruise",
      description:
        "Quick 90-minute cruise along the Bosphorus strait. Perfect for short layovers with stunning city views.",
      duration: "90 minutes",
      price: {
        amount: 30.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Bosphorus Cruise",
        },
      ],
      rating: 4.6,
      reviewCount: 1876,
      location: {
        city: "Istanbul",
        country: "Turkey",
      },
      highlights: ["Bosphorus Views", "Audio Guide", "Refreshments", "Photo Opportunities"],
    },
  ],
  Singapore: [
    {
      productCode: "VTR-SIN-001",
      title: "Gardens by the Bay & Marina Bay Sands SkyPark",
      description:
        "Visit Singapore's futuristic gardens and enjoy panoramic views from Marina Bay Sands observation deck.",
      duration: "4 hours",
      price: {
        amount: 75.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Gardens by the Bay",
        },
      ],
      rating: 4.8,
      reviewCount: 4567,
      location: {
        city: "Singapore",
        country: "Singapore",
      },
      highlights: ["Supertree Grove", "Cloud Forest", "SkyPark Access", "City Views"],
    },
    {
      productCode: "VTR-SIN-002",
      title: "Singapore Street Food Tour",
      description:
        "Discover authentic Singaporean cuisine at famous hawker centers. Ideal for food lovers on a layover.",
      duration: "3 hours",
      price: {
        amount: 45.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Hawker Center Food",
        },
      ],
      rating: 4.9,
      reviewCount: 2341,
      location: {
        city: "Singapore",
        country: "Singapore",
      },
      highlights: ["10+ Food Tastings", "Local Guide", "Hawker Centers", "Cultural Insights"],
    },
  ],
  Doha: [
    {
      productCode: "VTR-DOH-001",
      title: "Doha City Tour with Souq Waqif",
      description:
        "Explore Qatar's capital including the traditional Souq Waqif market and Corniche waterfront.",
      duration: "4 hours",
      price: {
        amount: 50.0,
        currency: "USD",
      },
      images: [
        {
          url: "/souq-waqif-doha.png",
          caption: "Souq Waqif Market",
        },
      ],
      rating: 4.7,
      reviewCount: 987,
      location: {
        city: "Doha",
        country: "Qatar",
      },
      highlights: ["Souq Waqif", "Pearl Qatar", "Corniche Walk", "Museum Quarter"],
    },
    {
      productCode: "VTR-DOH-002",
      title: "Desert Safari & Inland Sea Adventure",
      description:
        "Experience Qatar's desert landscape with dune bashing and a visit to the stunning Inland Sea.",
      duration: "5 hours",
      price: {
        amount: 85.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Qatar Desert",
        },
      ],
      rating: 4.8,
      reviewCount: 654,
      location: {
        city: "Doha",
        country: "Qatar",
      },
      highlights: ["Dune Bashing", "Inland Sea", "Camel Spotting", "Desert Photography"],
    },
  ],
  Amsterdam: [
    {
      productCode: "VTR-AMS-001",
      title: "Amsterdam Canal Cruise",
      description:
        "Classic 75-minute canal cruise through Amsterdam's historic waterways. Perfect for quick layovers.",
      duration: "75 minutes",
      price: {
        amount: 20.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Amsterdam Canals",
        },
      ],
      rating: 4.5,
      reviewCount: 6543,
      location: {
        city: "Amsterdam",
        country: "Netherlands",
      },
      highlights: ["UNESCO Canals", "Audio Guide", "Historic Houses", "Photo Spots"],
    },
    {
      productCode: "VTR-AMS-002",
      title: "Bike Tour of Amsterdam Highlights",
      description:
        "See Amsterdam like a local on this 3-hour guided bike tour through the city's best spots.",
      duration: "3 hours",
      price: {
        amount: 35.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Amsterdam Bike Tour",
        },
      ],
      rating: 4.8,
      reviewCount: 2341,
      location: {
        city: "Amsterdam",
        country: "Netherlands",
      },
      highlights: ["Bike Rental", "Local Guide", "Jordaan District", "Vondelpark"],
    },
  ],
  Reykjavik: [
    {
      productCode: "VTR-REY-001",
      title: "Blue Lagoon Admission with Transfer",
      description:
        "Relax in Iceland's famous geothermal spa. Includes round-trip transfer from Keflavik Airport.",
      duration: "4 hours",
      price: {
        amount: 120.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Blue Lagoon",
        },
      ],
      rating: 4.7,
      reviewCount: 8765,
      location: {
        city: "Reykjavik",
        country: "Iceland",
      },
      highlights: ["Blue Lagoon Entry", "Airport Transfer", "Towel Included", "Silica Mud Mask"],
    },
    {
      productCode: "VTR-REY-002",
      title: "Reykjavik City Walking Tour",
      description:
        "Discover Iceland's colorful capital on foot. See the main sights and learn about Viking history.",
      duration: "2.5 hours",
      price: {
        amount: 30.0,
        currency: "USD",
      },
      images: [
        {
          url: "/placeholder.jpg",
          caption: "Reykjavik City",
        },
      ],
      rating: 4.6,
      reviewCount: 1234,
      location: {
        city: "Reykjavik",
        country: "Iceland",
      },
      highlights: ["Hallgrímskirkja", "Harbor Area", "Viking History", "Local Stories"],
    },
  ],
}

export function getMockExperiences(city: string, maxDurationHours?: number) {
  const cityExperiences = mockViatorExperiences[city as keyof typeof mockViatorExperiences] || []

  if (maxDurationHours) {
    return cityExperiences.filter((exp) => {
      const duration = exp.duration.toLowerCase()
      let hours = 0

      if (duration.includes("minute")) {
        hours = parseInt(duration) / 60
      } else if (duration.includes("hour")) {
        hours = parseInt(duration)
      }

      return hours <= maxDurationHours
    })
  }

  return cityExperiences
}
