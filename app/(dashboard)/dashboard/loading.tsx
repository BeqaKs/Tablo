export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-7 w-48 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
          <div className="h-4 w-64 rounded mt-2" style={{ background: 'hsl(231 24% 12%)' }} />
        </div>
        <div className="h-10 w-40 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
      </div>

      {/* Quick Actions skeleton */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 w-32 rounded-lg" style={{ background: 'hsl(231 24% 12%)' }} />
        ))}
      </div>

      {/* KPI Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{ background: 'hsl(231 24% 10%)', border: '1px solid hsl(231 24% 14%)', borderLeft: '3px solid hsl(231 24% 20%)' }}
          >
            <div className="flex items-start justify-between">
              <div className="h-3 w-24 rounded" style={{ background: 'hsl(231 24% 16%)' }} />
              <div className="h-8 w-8 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
            </div>
            <div>
              <div className="h-8 w-16 rounded" style={{ background: 'hsl(231 24% 16%)' }} />
              <div className="h-3 w-32 rounded mt-2" style={{ background: 'hsl(231 24% 12%)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Grid skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <div
          className="col-span-1 lg:col-span-4 rounded-xl p-5"
          style={{ background: 'hsl(231 24% 10%)', border: '1px solid hsl(231 24% 14%)' }}
        >
          <div className="h-5 w-40 rounded mb-5" style={{ background: 'hsl(231 24% 16%)' }} />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-lg" style={{ background: 'hsl(231 24% 12%)' }} />
            ))}
          </div>
        </div>
        <div
          className="col-span-1 lg:col-span-3 rounded-xl p-5"
          style={{ background: 'hsl(231 24% 10%)', border: '1px solid hsl(231 24% 14%)' }}
        >
          <div className="h-5 w-36 rounded mb-5" style={{ background: 'hsl(231 24% 16%)' }} />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-14 rounded-lg" style={{ background: 'hsl(231 24% 12%)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Chart skeleton */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'hsl(231 24% 10%)', border: '1px solid hsl(231 24% 14%)' }}
      >
        <div className="h-5 w-48 rounded mb-6" style={{ background: 'hsl(231 24% 16%)' }} />
        <div className="h-48 rounded-lg" style={{ background: 'hsl(231 24% 12%)' }} />
      </div>
    </div>
  );
}
