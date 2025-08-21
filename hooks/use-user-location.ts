import { useState, useEffect } from "react"

export interface UserLocation {
  city: string
  country: string
  airportCode: string
  latitude: number
  longitude: number
}

// Major city to airport mapping
const CITY_AIRPORTS: Record<string, string> = {
  "New York": "JFK",
  "Los Angeles": "LAX",
  Chicago: "ORD",
  Houston: "IAH",
  Phoenix: "PHX",
  Philadelphia: "PHL",
  "San Antonio": "SAT",
  "San Diego": "SAN",
  Dallas: "DFW",
  "San Jose": "SJC",
  Austin: "AUS",
  Jacksonville: "JAX",
  "Fort Worth": "DFW",
  Columbus: "CMH",
  "San Francisco": "SFO",
  Charlotte: "CLT",
  Indianapolis: "IND",
  Seattle: "SEA",
  Denver: "DEN",
  Washington: "DCA",
  Boston: "BOS",
  Miami: "MIA",
  Atlanta: "ATL",
  London: "LHR",
  Paris: "CDG",
  Tokyo: "NRT",
  Dubai: "DXB",
  Singapore: "SIN",
  Amsterdam: "AMS",
  Frankfurt: "FRA",
  Istanbul: "IST",
  Madrid: "MAD",
  Barcelona: "BCN",
  Rome: "FCO",
  Munich: "MUC",
  Berlin: "BER",
  Toronto: "YYZ",
  Vancouver: "YVR",
  Montreal: "YUL",
  Sydney: "SYD",
  Melbourne: "MEL",
  Brisbane: "BNE",
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we have a cached location
    const cachedLocation = localStorage.getItem("userLocation")
    if (cachedLocation) {
      setLocation(JSON.parse(cachedLocation))
      setLoading(false)
      return
    }

    // Try to get location from browser
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get city information
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
            )

            if (response.ok) {
              const data = await response.json()
              const city = data.city || data.locality || "New York"
              const country = data.countryName || "United States"
              const airportCode = CITY_AIRPORTS[city] || "JFK"

              const userLocation: UserLocation = {
                city,
                country,
                airportCode,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }

              setLocation(userLocation)
              localStorage.setItem("userLocation", JSON.stringify(userLocation))
            } else {
              throw new Error("Failed to get location details")
            }
          } catch (err) {
            console.error("Error getting location details:", err)
            setDefaultLocation()
          } finally {
            setLoading(false)
          }
        },
        (err) => {
          console.error("Geolocation error:", err)
          setError(err.message)
          setDefaultLocation()
          setLoading(false)
        },
        {
          timeout: 5000,
          maximumAge: 3600000, // 1 hour
        },
      )
    } else {
      setDefaultLocation()
      setLoading(false)
    }
  }, [])

  const setDefaultLocation = () => {
    const defaultLocation: UserLocation = {
      city: "New York",
      country: "United States",
      airportCode: "JFK",
      latitude: 40.7128,
      longitude: -74.006,
    }
    setLocation(defaultLocation)
    localStorage.setItem("userLocation", JSON.stringify(defaultLocation))
  }

  const updateLocation = (newLocation: UserLocation) => {
    setLocation(newLocation)
    localStorage.setItem("userLocation", JSON.stringify(newLocation))
  }

  return { location, loading, error, updateLocation }
}
