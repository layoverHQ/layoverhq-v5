import { NextRequest, NextResponse } from 'next/server'
import { errorTracker } from './error-tracker'

interface RouteConfig {
  path: string
  requiresAuth: boolean
  fallback?: string
  allowedRoles?: string[]
  rateLimit?: number
  healthCheck?: boolean
}

interface RouteHealth {
  path: string
  status: 'healthy' | 'degraded' | 'failed'
  lastChecked: Date
  errorCount: number
  responseTime?: number
}

export class EnterpriseRoutingModule {
  private routes: Map<string, RouteConfig> = new Map()
  private routeHealth: Map<string, RouteHealth> = new Map()
  private failedRoutes: Set<string> = new Set()
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date }> = new Map()

  constructor() {
    this.initializeDefaultRoutes()
  }

  private initializeDefaultRoutes() {
    // Public routes - no auth required
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/api/auth/callback',
      '/api/setup-admin',
      '/fix-roles',
      '/api/fix-admin-roles',
      '/icon.svg',
      '/favicon.ico',
      '/manifest.webmanifest',
      // Add design showcase and other public pages
      '/design-showcase',
      '/yc-pitch',
      '/search',
      '/experiences'
    ]

    // Protected routes with auth
    const protectedRoutes = [
      '/dashboard',
      '/admin',
      '/admin/*',
      '/profile',
      '/settings',
      '/api/admin/*',
      '/api/user/*',
      '/hacker-mode',
      '/achievements'
    ]

    // API routes with special handling
    const apiRoutes = [
      '/api/v1/*',
      '/api/gateway/*',
      '/api/experiences/*',
      '/api/recommendations',
      '/api/layover/*',
      '/api/images/*'
    ]

    // Register all routes
    publicRoutes.forEach(route => {
      this.registerRoute({
        path: route,
        requiresAuth: false,
        healthCheck: true
      })
    })

    protectedRoutes.forEach(route => {
      this.registerRoute({
        path: route,
        requiresAuth: true,
        fallback: '/',
        healthCheck: true
      })
    })

    apiRoutes.forEach(route => {
      this.registerRoute({
        path: route,
        requiresAuth: false, // API routes handle their own auth
        healthCheck: true,
        rateLimit: 100 // requests per minute
      })
    })
  }

  registerRoute(config: RouteConfig) {
    this.routes.set(config.path, config)
    
    // Initialize health tracking
    if (config.healthCheck) {
      this.routeHealth.set(config.path, {
        path: config.path,
        status: 'healthy',
        lastChecked: new Date(),
        errorCount: 0
      })
    }
  }

  async handleRequest(request: NextRequest): Promise<NextResponse | null> {
    const path = request.nextUrl.pathname
    const startTime = Date.now()

    try {
      // Check if route is in circuit breaker state
      if (this.isCircuitOpen(path)) {
        console.error(`[EnterpriseRouter] Circuit breaker open for ${path}`)
        return this.handleFailedRoute(request, path)
      }

      // Find matching route config
      const routeConfig = this.findRouteConfig(path)
      
      if (!routeConfig) {
        // Unknown route - track as 404
        errorTracker.track404(path, request.headers.get('referer') || undefined)
        return null // Let Next.js handle 404
      }

      // Check authentication if required
      if (routeConfig.requiresAuth && !this.isAuthenticated(request)) {
        console.log(`[EnterpriseRouter] Auth required for ${path}, redirecting`)
        return NextResponse.redirect(new URL(routeConfig.fallback || '/', request.url))
      }

      // Rate limiting check
      if (routeConfig.rateLimit && !this.checkRateLimit(path, routeConfig.rateLimit)) {
        return new NextResponse('Too Many Requests', { status: 429 })
      }

      // Update route health metrics
      this.updateRouteHealth(path, true, Date.now() - startTime)

      return null // Allow request to continue
    } catch (error) {
      console.error(`[EnterpriseRouter] Error handling ${path}:`, error)
      this.handleRouteError(path, error as Error)
      return this.handleFailedRoute(request, path)
    }
  }

  private findRouteConfig(path: string): RouteConfig | undefined {
    // Direct match
    if (this.routes.has(path)) {
      return this.routes.get(path)
    }

    // Wildcard match
    for (const [pattern, config] of this.routes) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$')
        if (regex.test(path)) {
          return config
        }
      }
    }

    return undefined
  }

  private isAuthenticated(request: NextRequest): boolean {
    // Check for auth cookies or tokens
    const authToken = request.cookies.get('sb-ffvviuxkbjfautyvdpix-auth-token')
    return !!authToken
  }

  private checkRateLimit(path: string, limit: number): boolean {
    // Simple rate limiting implementation
    // In production, use Redis or similar
    return true // Placeholder
  }

  private isCircuitOpen(path: string): boolean {
    const breaker = this.circuitBreakers.get(path)
    if (!breaker) return false

    // Reset circuit after 30 seconds
    const resetTime = 30000
    if (Date.now() - breaker.lastFailure.getTime() > resetTime) {
      this.circuitBreakers.delete(path)
      return false
    }

    // Open circuit after 5 failures
    return breaker.failures >= 5
  }

  private handleRouteError(path: string, error: Error) {
    errorTracker.trackError(path, error.message)
    
    // Update circuit breaker
    const breaker = this.circuitBreakers.get(path) || { failures: 0, lastFailure: new Date() }
    breaker.failures++
    breaker.lastFailure = new Date()
    this.circuitBreakers.set(path, breaker)

    // Update route health
    this.updateRouteHealth(path, false)
  }

  private handleFailedRoute(request: NextRequest, path: string): NextResponse {
    const routeConfig = this.findRouteConfig(path)
    
    if (routeConfig?.fallback) {
      // Redirect to fallback route
      return NextResponse.redirect(new URL(routeConfig.fallback, request.url))
    }

    // Return error page
    return new NextResponse(
      `
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1>Route Temporarily Unavailable</h1>
          <p>The route ${path} is experiencing issues.</p>
          <p>Please try again in a few moments.</p>
          <a href="/" style="color: blue;">Return to Home</a>
        </body>
      </html>
      `,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }

  private updateRouteHealth(path: string, success: boolean, responseTime?: number) {
    const health = this.routeHealth.get(path)
    if (!health) return

    health.lastChecked = new Date()
    health.responseTime = responseTime

    if (success) {
      health.errorCount = 0
      health.status = responseTime && responseTime > 3000 ? 'degraded' : 'healthy'
    } else {
      health.errorCount++
      health.status = health.errorCount > 3 ? 'failed' : 'degraded'
    }

    this.routeHealth.set(path, health)
  }

  // Public methods for monitoring
  getRouteHealth(): RouteHealth[] {
    return Array.from(this.routeHealth.values())
  }

  getFailedRoutes(): string[] {
    return Array.from(this.failedRoutes)
  }

  getCircuitBreakerStatus(): Map<string, { failures: number; lastFailure: Date }> {
    return this.circuitBreakers
  }

  resetCircuitBreaker(path: string) {
    this.circuitBreakers.delete(path)
    console.log(`[EnterpriseRouter] Circuit breaker reset for ${path}`)
  }

  // Health check endpoint data
  generateHealthReport() {
    const routes = this.getRouteHealth()
    const failed = routes.filter(r => r.status === 'failed')
    const degraded = routes.filter(r => r.status === 'degraded')
    const healthy = routes.filter(r => r.status === 'healthy')

    return {
      summary: {
        total: routes.length,
        healthy: healthy.length,
        degraded: degraded.length,
        failed: failed.length
      },
      routes: {
        failed: failed.map(r => r.path),
        degraded: degraded.map(r => r.path),
        circuitBreakers: Array.from(this.circuitBreakers.keys())
      },
      timestamp: new Date().toISOString()
    }
  }
}

// Singleton instance
export const enterpriseRouter = new EnterpriseRoutingModule()