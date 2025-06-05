export function Stats() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
      <div className="bg-white rounded-2xl shadow-2xl">
        <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <div className="text-center p-8">
            <div className="stat-number mb-2">2hr</div>
            <p className="font-semibold text-gray-700">Delivery Time</p>
          </div>
          <div className="text-center p-8">
            <div className="stat-number mb-2">50t</div>
            <p className="font-semibold text-gray-700">Storage Capacity</p>
          </div>
          <div className="text-center p-8">
            <div className="stat-number mb-2">24/7</div>
            <p className="font-semibold text-gray-700">Emergency Service</p>
          </div>
          <div className="text-center p-8">
            <div className="stat-number mb-2">ZERA</div>
            <p className="font-semibold text-gray-700">Licensed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
