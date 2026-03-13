export default function GuestsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
          <div className="h-4 w-64 rounded mt-2" style={{ background: 'hsl(231 24% 12%)' }} />
        </div>
        <div className="h-10 w-28 rounded-lg" style={{ background: 'hsl(231 24% 14%)' }} />
      </div>

      {/* Search bar */}
      <div className="h-10 w-full rounded-lg" style={{ background: 'hsl(231 24% 12%)', border: '1px solid hsl(231 24% 16%)' }} />

      {/* Guest cards */}
      <div className="grid gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl p-4"
            style={{ background: 'hsl(231 24% 10%)', border: '1px solid hsl(231 24% 14%)' }}
          >
            <div className="h-10 w-10 rounded-full" style={{ background: 'hsl(231 24% 16%)' }} />
            <div className="flex-1">
              <div className="h-4 w-32 rounded" style={{ background: 'hsl(231 24% 16%)' }} />
              <div className="h-3 w-48 rounded mt-2" style={{ background: 'hsl(231 24% 12%)' }} />
            </div>
            <div className="h-6 w-16 rounded-full" style={{ background: 'hsl(231 24% 14%)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
