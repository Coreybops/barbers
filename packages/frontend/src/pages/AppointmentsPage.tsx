export function AppointmentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-2">
          View and manage your barber appointments.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button className="border-transparent text-primary border-b-2 py-2 px-1 text-sm font-medium">
            Upcoming
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 py-2 px-1 text-sm font-medium">
            Past
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 py-2 px-1 text-sm font-medium">
            Cancelled
          </button>
        </nav>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No appointments found
        </h3>
        <p className="text-gray-600 mb-6">
          You haven't booked any appointments yet. Find a barbershop to get started.
        </p>
        <button className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90">
          Book Appointment
        </button>
      </div>
    </div>
  );
}