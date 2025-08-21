import { NextResponse } from 'next/server'
import { enterpriseRouter } from '@/lib/services/enterprise-routing-module'
import { errorTracker } from '@/lib/services/error-tracker'

export async function GET() {
  try {
    // Get routing health report
    const routingHealth = enterpriseRouter.generateHealthReport()
    
    // Get error tracking report
    const errorReport = errorTracker.generateReport()
    
    // Get circuit breaker status
    const circuitBreakers = Array.from(enterpriseRouter.getCircuitBreakerStatus().entries()).map(
      ([path, status]) => ({
        path,
        failures: status.failures,
        lastFailure: status.lastFailure.toISOString()
      })
    )

    // Overall system health
    const systemHealth = {
      status: routingHealth.summary.failed > 0 ? 'unhealthy' : 
              routingHealth.summary.degraded > 2 ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      routing: routingHealth,
      errors: {
        total: errorReport.totalErrors,
        byType: errorReport.errorsByType,
        brokenRoutes: errorReport.brokenRoutes.slice(0, 10), // Top 10
        recentErrors: errorReport.recentErrors.slice(0, 5) // Last 5
      },
      circuitBreakers,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }

    // Set appropriate status code based on health
    const statusCode = systemHealth.status === 'unhealthy' ? 503 : 
                       systemHealth.status === 'degraded' ? 200 : 200

    return NextResponse.json(systemHealth, { status: statusCode })
  } catch (error) {
    console.error('[HealthCheck] Error generating health report:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to generate health report',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Health check for specific route
export async function POST(request: Request) {
  try {
    const { path } = await request.json()
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      )
    }

    // Reset circuit breaker for the path
    enterpriseRouter.resetCircuitBreaker(path)
    
    return NextResponse.json({
      message: `Circuit breaker reset for ${path}`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[HealthCheck] Error resetting circuit breaker:', error)
    return NextResponse.json(
      { error: 'Failed to reset circuit breaker' },
      { status: 500 }
    )
  }
}