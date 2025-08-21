"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong!</h1>
              <p className="text-gray-600 text-lg mb-6">
                We're sorry, but there was an unexpected error. Our team has been notified.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-red-900 mb-2">Error Details</h3>
                <p className="text-red-800 text-sm font-mono break-all">{error.message}</p>
                {error.digest && (
                  <p className="text-red-600 text-xs mt-2">Error ID: {error.digest}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={reset}
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
              </div>

              <div className="text-center pt-6 border-t border-gray-200 mt-6">
                <p className="text-gray-500 text-sm">
                  Need help? Contact LayoverHQ support at{" "}
                  <a
                    href="mailto:support@layoverhq.com"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    support@layoverhq.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
