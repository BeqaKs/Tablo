export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-80px)] animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div>
          <div className="h-7 w-56 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
          <div className="h-4 w-40 rounded mt-2" style={{ background: 'hsl(231 24% 12%)' }} />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
          <div className="h-9 w-24 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
        </div>
      </div>

      {/* Date nav skeleton */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-8 w-8 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-14 w-14 rounded-xl" style={{ background: 'hsl(231 24% 12%)' }} />
          ))}
        </div>
        <div className="h-8 w-8 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
      </div>

      {/* Stats bar skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-xl p-4" style={{ background: 'hsl(231 32% 10%)', border: '1px solid hsl(231 24% 16%)' }}>
            <div className="h-2 w-16 rounded mb-2" style={{ background: 'hsl(231 24% 16%)' }} />
            <div className="h-7 w-10 rounded" style={{ background: 'hsl(231 24% 16%)' }} />
            <div className="h-2 w-20 rounded mt-2" style={{ background: 'hsl(231 24% 12%)' }} />
          </div>
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="flex-1 rounded-xl overflow-hidden" style={{ background: 'hsl(231 24% 10%)', border: '1px solid hsl(231 24% 14%)' }}>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-12 rounded" style={{ background: 'hsl(231 24% 14%)' }} />
              <div className="flex-1 h-12 rounded-lg" style={{ background: 'hsl(231 24% 12%)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
