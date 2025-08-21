export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-slate-200 rounded-lg w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-96 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl h-64 animate-pulse" />
            <div className="bg-white rounded-xl h-96 animate-pulse" />
            <div className="bg-white rounded-xl h-96 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl h-48 animate-pulse" />
            <div className="bg-white rounded-xl h-64 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
