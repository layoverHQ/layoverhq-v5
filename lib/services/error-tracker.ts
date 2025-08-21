// Simple error tracking service for 404s and broken routes
interface ErrorLog {
  type: '404' | 'error' | 'broken_link'
  path: string
  timestamp: Date
  referrer?: string
  userAgent?: string
  errorMessage?: string
}

class ErrorTracker {
  private errors: ErrorLog[] = []
  private brokenRoutes: Set<string> = new Set()

  track404(path: string, referrer?: string, userAgent?: string) {
    const error: ErrorLog = {
      type: '404',
      path,
      timestamp: new Date(),
      referrer,
      userAgent
    }
    
    this.errors.push(error)
    this.brokenRoutes.add(path)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚫 404 Error:', error)
    }

    // Send to external service (Sentry, LogRocket, etc)
    this.sendToMonitoringService(error)
  }

  trackError(path: string, errorMessage: string) {
    const error: ErrorLog = {
      type: 'error',
      path,
      timestamp: new Date(),
      errorMessage
    }
    
    this.errors.push(error)
    console.error('❌ Application Error:', error)
    this.sendToMonitoringService(error)
  }

  trackBrokenLink(from: string, to: string) {
    const error: ErrorLog = {
      type: 'broken_link',
      path: to,
      timestamp: new Date(),
      referrer: from
    }
    
    this.errors.push(error)
    this.brokenRoutes.add(to)
    console.warn('🔗 Broken Link:', error)
  }

  private sendToMonitoringService(error: ErrorLog) {
    // Integrate with Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(`${error.type}: ${error.path}`, 'error')
    }

    // Or send to your API
    if (typeof window !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      }).catch(() => {
        // Silently fail if API is down
      })
    }
  }

  getBrokenRoutes(): string[] {
    return Array.from(this.brokenRoutes)
  }

  getRecentErrors(limit = 100): ErrorLog[] {
    return this.errors.slice(-limit)
  }

  generateReport() {
    const report = {
      totalErrors: this.errors.length,
      brokenRoutes: this.getBrokenRoutes(),
      errorsByType: {
        '404': this.errors.filter(e => e.type === '404').length,
        'error': this.errors.filter(e => e.type === 'error').length,
        'broken_link': this.errors.filter(e => e.type === 'broken_link').length
      },
      recentErrors: this.getRecentErrors(20)
    }
    
    console.table(report.errorsByType)
    console.log('Broken Routes:', report.brokenRoutes)
    return report
  }
}

export const errorTracker = new ErrorTracker()