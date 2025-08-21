import type React from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Temporarily disable auth check for development

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-64 min-h-screen border-r bg-card">
          <div className="p-6">
            <h2 className="text-lg font-semibold">LayoverHQ Admin</h2>
          </div>
          <nav className="space-y-1 px-3">
            <a href="/admin" className="block px-3 py-2 rounded-md hover:bg-accent">
              Dashboard
            </a>
            <a href="/admin/tenants" className="block px-3 py-2 rounded-md hover:bg-accent">
              Tenants
            </a>
            <a href="/admin/configuration" className="block px-3 py-2 rounded-md hover:bg-accent">
              Configuration
            </a>
            <a href="/admin/white-label" className="block px-3 py-2 rounded-md hover:bg-accent">
              White Label
            </a>
            <a href="/admin/monitoring" className="block px-3 py-2 rounded-md hover:bg-accent">
              Monitoring
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
