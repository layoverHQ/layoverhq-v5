"use client"

import React from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showErrorDetails?: boolean
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo
  resetError: () => void
  showDetails: boolean
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", error)
      console.error("Error Info:", errorInfo)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you would send this to your error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo!}
          resetError={this.resetError}
          showDetails={this.props.showErrorDetails ?? process.env.NODE_ENV === "development"}
        />
      )
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  showDetails,
}) => {
  const [showFullError, setShowFullError] = React.useState(false)

  const isComponentError =
    error.message.includes("type is invalid") || error.message.includes("is not exported")

  const getErrorCategory = () => {
    if (isComponentError) {
      return {
        title: "Component Error",
        description:
          "There's an issue with a React component. This is likely due to a missing export or import error.",
        icon: <Bug className="h-8 w-8 text-red-500" />,
        category: "component",
      }
    }

    return {
      title: "Application Error",
      description: "Something unexpected happened. Our team has been notified.",
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      category: "general",
    }
  }

  const errorCategory = getErrorCategory()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8">
          <div className="text-center mb-8">
            {errorCategory.icon}
            <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">{errorCategory.title}</h1>
            <p className="text-gray-600 text-lg">{errorCategory.description}</p>
          </div>

          {/* Error Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">Error Details</h3>
            <p className="text-red-800 text-sm font-mono break-all">{error.message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={resetError}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>
          </div>

          {/* Component-specific help */}
          {isComponentError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Development Note</h3>
              <p className="text-blue-800 text-sm">This error typically occurs when:</p>
              <ul className="text-blue-800 text-sm mt-2 ml-4 list-disc">
                <li>A component is not properly exported from its module</li>
                <li>There's a mismatch between import and export names</li>
                <li>A dependency is missing or not installed</li>
              </ul>
            </div>
          )}

          {/* Detailed Error Info (Development Only) */}
          {showDetails && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Technical Details</h3>
                <button
                  onClick={() => setShowFullError(!showFullError)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showFullError ? "Hide" : "Show"} Full Error
                </button>
              </div>

              {showFullError && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Stack Trace</h4>
                    <pre className="bg-gray-100 p-4 rounded-lg text-xs text-gray-800 overflow-x-auto">
                      {error.stack}
                    </pre>
                  </div>

                  {errorInfo && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Component Stack</h4>
                      <pre className="bg-gray-100 p-4 rounded-lg text-xs text-gray-800 overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LayoverHQ Branding */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Need help? Contact LayoverHQ support at{" "}
              <a href="mailto:support@layoverhq.com" className="text-blue-600 hover:text-blue-800">
                support@layoverhq.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Convenience wrapper for pages
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandling = () => {
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason)
      // In production, send to error reporting service
    })

    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error)
      // In production, send to error reporting service
    })
  }
}

export default ErrorBoundary
export type { ErrorBoundaryProps, ErrorFallbackProps }
