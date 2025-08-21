interface OpenSkyConfig {
  username?: string
  password?: string
  baseUrl: string
}

interface OpenSkyState {
  icao24: string
  callsign: string | null
  origin_country: string
  time_position: number | null
  last_contact: number
  longitude: number | null
  latitude: number | null
  baro_altitude: number | null
  on_ground: boolean
  velocity: number | null
  true_track: number | null
  vertical_rate: number | null
  sensors: number[] | null
  geo_altitude: number | null
  squawk: string | null
  spi: boolean
  position_source: number
}

interface OpenSkyStatesResponse {
  time: number
  states: OpenSkyState[]
}

interface FlightTrack {
  icao24: string
  startTime: number
  endTime: number
  callsign: string
  path: Array<{
    time: number
    latitude: number
    longitude: number
    baro_altitude: number
    true_track: number
    on_ground: boolean
  }>
}

export class OpenSkyAPI {
  private config: OpenSkyConfig

  constructor(config: OpenSkyConfig) {
    this.config = config
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (this.config.username && this.config.password) {
      const credentials = btoa(`${this.config.username}:${this.config.password}`)
      headers["Authorization"] = `Basic ${credentials}`
    }

    return headers
  }

  async getAllStates(
    time?: number,
    icao24?: string,
    bbox?: { lamin: number; lomin: number; lamax: number; lomax: number },
  ): Promise<OpenSkyStatesResponse> {
    const params = new URLSearchParams()

    if (time) params.append("time", time.toString())
    if (icao24) params.append("icao24", icao24)
    if (bbox) {
      params.append("lamin", bbox.lamin.toString())
      params.append("lomin", bbox.lomin.toString())
      params.append("lamax", bbox.lamax.toString())
      params.append("lomax", bbox.lomax.toString())
    }

    const url = `${this.config.baseUrl}/api/states/all${params.toString() ? `?${params}` : ""}`

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`OpenSky states fetch failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      time: data.time,
      states:
        data.states?.map((state: any[]) => ({
          icao24: state[0],
          callsign: state[1]?.trim() || null,
          origin_country: state[2],
          time_position: state[3],
          last_contact: state[4],
          longitude: state[5],
          latitude: state[6],
          baro_altitude: state[7],
          on_ground: state[8],
          velocity: state[9],
          true_track: state[10],
          vertical_rate: state[11],
          sensors: state[12],
          geo_altitude: state[13],
          squawk: state[14],
          spi: state[15],
          position_source: state[16],
        })) || [],
    }
  }

  async getMyStates(): Promise<OpenSkyStatesResponse> {
    if (!this.config.username || !this.config.password) {
      throw new Error("Authentication required for my states endpoint")
    }

    const response = await fetch(`${this.config.baseUrl}/api/states/own`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`OpenSky my states fetch failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      time: data.time,
      states:
        data.states?.map((state: any[]) => ({
          icao24: state[0],
          callsign: state[1]?.trim() || null,
          origin_country: state[2],
          time_position: state[3],
          last_contact: state[4],
          longitude: state[5],
          latitude: state[6],
          baro_altitude: state[7],
          on_ground: state[8],
          velocity: state[9],
          true_track: state[10],
          vertical_rate: state[11],
          sensors: state[12],
          geo_altitude: state[13],
          squawk: state[14],
          spi: state[15],
          position_source: state[16],
        })) || [],
    }
  }

  async getFlightsByAircraft(icao24: string, begin: number, end: number): Promise<any[]> {
    const params = new URLSearchParams({
      icao24,
      begin: begin.toString(),
      end: end.toString(),
    })

    const response = await fetch(`${this.config.baseUrl}/api/flights/aircraft?${params}`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`OpenSky flights by aircraft fetch failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getFlightsByAirport(airport: string, begin: number, end: number): Promise<any[]> {
    const params = new URLSearchParams({
      airport,
      begin: begin.toString(),
      end: end.toString(),
    })

    const response = await fetch(`${this.config.baseUrl}/api/flights/arrival?${params}`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`OpenSky flights by airport fetch failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getFlightTrack(icao24: string, time: number): Promise<FlightTrack | null> {
    const params = new URLSearchParams({
      icao24,
      time: time.toString(),
    })

    const response = await fetch(`${this.config.baseUrl}/api/tracks/all?${params}`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`OpenSky flight track fetch failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.path || data.path.length === 0) {
      return null
    }

    return {
      icao24: data.icao24,
      startTime: data.startTime,
      endTime: data.endTime,
      callsign: data.callsign,
      path: data.path.map((point: any[]) => ({
        time: point[0],
        latitude: point[1],
        longitude: point[2],
        baro_altitude: point[3],
        true_track: point[4],
        on_ground: point[5],
      })),
    }
  }
}
