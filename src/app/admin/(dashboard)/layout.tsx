import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
