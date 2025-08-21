export default function TestSetupPage() {
  console.log("[v0] TestSetupPage component loaded")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Test Setup Page</h2>
          <p className="mt-2 text-sm text-gray-600">This is a test page to verify routing works</p>
          <div className="mt-4 space-y-2">
            <div>
              <a href="/setup-admin" className="text-blue-600 hover:text-blue-500 underline block">
                Go to Setup Admin
              </a>
            </div>
            <div>
              <a href="/" className="text-green-600 hover:text-green-500 underline block">
                Go to Main Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
