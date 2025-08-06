export function BarbershopsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Barbershops</h1>
        <p className="text-gray-600 mt-2">
          Discover the best barbershops in your area.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              placeholder="Enter city or zip code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary">
              <option>All Services</option>
              <option>Haircut</option>
              <option>Beard Trim</option>
              <option>Hot Towel Shave</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary">
              <option>Distance</option>
              <option>Rating</option>
              <option>Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No barbershops found
        </h3>
        <p className="text-gray-600">
          Try adjusting your search criteria or check back later.
        </p>
      </div>
    </div>
  );
}