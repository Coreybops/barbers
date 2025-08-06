import React from 'react';
import { useBookingStore } from '@/store/bookingStore';

export const BarbershopStep: React.FC = () => {
  const { selectedBarbershop } = useBookingStore();

  // This step is typically skipped since barbershop is selected from search
  // But we show the selected barbershop info for confirmation
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Selected Barbershop
        </h2>
        <p className="text-gray-600">
          You've selected the following barbershop for your appointment
        </p>
      </div>

      {selectedBarbershop && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            {selectedBarbershop.images && selectedBarbershop.images.length > 0 ? (
              <img
                src={selectedBarbershop.images[0]}
                alt={selectedBarbershop.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-2xl">✂️</span>
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedBarbershop.name}
              </h3>
              <p className="text-gray-600 mb-2">
                {selectedBarbershop.address}, {selectedBarbershop.city}, {selectedBarbershop.state}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>⭐ {selectedBarbershop.rating.toFixed(1)} ({selectedBarbershop.reviewCount} reviews)</span>
                <span>📞 {selectedBarbershop.phone}</span>
              </div>
              {selectedBarbershop.description && (
                <p className="text-gray-600 mt-3 text-sm">
                  {selectedBarbershop.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};