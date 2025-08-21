import Link from "next/link"
import { Home, Search, MapPin } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
          {/* 404 Animation */}
          <div className="relative mb-8">
            <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-16 w-16 text-blue-500 animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 text-lg mb-8">
            Looks like this destination doesn't exist. Let's get you back on track for your next
            layover adventure!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>

            <Link
              href="/search"
              className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Search className="h-4 w-4" />
              Search Experiences
            </Link>
          </div>

          <div className="text-center pt-6 border-t border-gray-200 mt-8">
            <p className="text-gray-500 text-sm">
              Lost? Need help finding your next layover adventure?{" "}
              <Link href="/support" className="text-blue-600 hover:text-blue-800">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
