import { useQuery } from '@tanstack/react-query';
import type { Product } from '@shared/schema';
import { ProductCard } from './ProductCard';

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
        <h2 className="section-title text-3xl md:text-4xl text-center mb-16">Shop Online</h2>
        
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
