import React from 'react';
import { Scissors, Sparkles, Zap, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format';

interface PopularServicesProps {
  onServiceClick: (service: { name: string; category: string }) => void;
}

const popularServices = [
  {
    name: 'Classic Haircut',
    category: 'haircut',
    icon: Scissors,
    description: 'Traditional men\'s haircut with styling',
    avgPrice: 35,
    avgDuration: 30,
    popularity: 95
  },
  {
    name: 'Beard Trim',
    category: 'beard',
    icon: Sparkles,
    description: 'Professional beard trimming and shaping',
    avgPrice: 25,
    avgDuration: 20,
    popularity: 87
  },
  {
    name: 'Hot Towel Shave',
    category: 'shave',
    icon: Zap,
    description: 'Luxury straight razor shave with hot towel',
    avgPrice: 45,
    avgDuration: 45,
    popularity: 78
  },
  {
    name: 'Express Cut',
    category: 'express',
    icon: Clock,
    description: 'Quick trim for busy schedules',
    avgPrice: 25,
    avgDuration: 15,
    popularity: 82
  }
];

export const PopularServices: React.FC<PopularServicesProps> = ({ onServiceClick }) => {
  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Popular Services
        </h2>
        <p className="text-gray-600">
          Book these trending services at barbershops near you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {popularServices.map((service) => {
          const IconComponent = service.icon;
          
          return (
            <Card
              key={service.name}
              className="p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 group"
              onClick={() => onServiceClick(service)}
            >
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 rounded-full p-4 mx-auto mb-4 w-16 h-16 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <IconComponent className="h-8 w-8" />
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {service.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {service.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    From {formatCurrency(service.avgPrice)}
                  </div>
                  <div className="text-gray-600">
                    {service.avgDuration} min
                  </div>
                </div>
                
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {service.popularity}% choose this
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Category Highlights */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Hair Styling', count: '150+ shops' },
          { name: 'Beard Care', count: '120+ shops' },
          { name: 'Classic Shaves', count: '80+ shops' },
          { name: 'Express Services', count: '200+ shops' }
        ].map((category) => (
          <div
            key={category.name}
            className="text-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => onServiceClick({ name: category.name, category: category.name.toLowerCase() })}
          >
            <div className="font-medium text-gray-900 text-sm">{category.name}</div>
            <div className="text-xs text-gray-600 mt-1">{category.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};