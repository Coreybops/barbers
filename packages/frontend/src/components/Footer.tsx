export function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">BB</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                BarberBooking
              </span>
            </div>
            <p className="text-gray-600 text-sm max-w-md">
              The modern way to book barber appointments. Find the best barbershops 
              in your area and book your next cut online.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">About</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Contact</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Help Center</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a></li>
              <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Status</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            © 2024 BarberBooking. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}