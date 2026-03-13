export default function RestaurantsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 animate-pulse">
      {/* Header */}
      <div className="h-8 w-48 rounded-lg bg-gray-200 mb-2" />
      <div className="h-4 w-72 rounded bg-gray-100 mb-8" />

      {/* Search */}
      <div className="h-12 w-full rounded-xl bg-gray-100 mb-8" />

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
            <div className="h-48 bg-gray-200" />
            <div className="p-5">
              <div className="h-5 w-40 rounded bg-gray-200 mb-2" />
              <div className="h-3 w-32 rounded bg-gray-100 mb-3" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-gray-100" />
                <div className="h-6 w-20 rounded-full bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
