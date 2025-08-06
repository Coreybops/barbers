import { useParams } from 'react-router-dom';

export function BarbershopDetailPage() {
  const { id } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Barbershop Details
        </h1>
        <p className="text-gray-600">
          Barbershop ID: {id}
        </p>
        <p className="text-gray-600 mt-2">
          This page will show detailed information about the selected barbershop.
        </p>
      </div>
    </div>
  );
}