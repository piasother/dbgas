import { useQuery } from '@tanstack/react-query';
import type { Product } from '@shared/schema';
import { ProductCard } from './ProductCard';
import { RETAIL_PRICE_PER_KG, WHOLESALE_PRICE_PER_KG, formatUsd } from '@/lib/pricing';

export function Shop() {
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  if (isLoading) {
    return (
      <section id="shop" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-3xl md:text-4xl text-center mb-16">Shop Online</h2>
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 h-48 rounded-t-2xl"></div>
                <div className="p-6 bg-white rounded-b-2xl">
                  <div className="h-4 bg-gray-300 rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="shop" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-3xl md:text-4xl text-center mb-16">Shop Online</h2>
          <div className="text-center text-red-600">
            <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
            <p className="text-lg">Failed to load products. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  const lpgProducts = products?.filter(p => p.category === 'lpg') || [];

  return (
    <section id="shop" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title text-3xl md:text-4xl text-center mb-12">Shop Online</h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Retail LPG</p>
              <p className="text-gray-600 text-sm mt-1">Cylinder refills for homes and small businesses</p>
            </div>
            <p className="text-2xl font-bold text-orange-600 whitespace-nowrap">{formatUsd(RETAIL_PRICE_PER_KG)}<span className="text-base font-semibold text-gray-500">/kg</span></p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">Wholesale LPG</p>
              <p className="text-gray-600 text-sm mt-1">Bulk supply for commercial customers. <a href="#contact" className="underline">Contact us</a></p>
            </div>
            <p className="text-2xl font-bold text-blue-900 whitespace-nowrap">{formatUsd(WHOLESALE_PRICE_PER_KG)}<span className="text-base font-semibold text-gray-500">/kg</span></p>
          </div>
        </div>

        <div className="mb-12">
          <h4 className="text-2xl font-semibold text-primary mb-8">LPG Products</h4>
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            {lpgProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
