import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main content - padding adjusts based on sidebar state */}
      <main className="pl-64 smooth-transition">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/80 px-8 backdrop-blur-sm shadow-sm">
          <h1 className="text-sm font-semibold text-foreground">Restaurant Control Center</h1>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-tablo-red-600 flex items-center justify-center text-white text-sm font-semibold">
              R
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}