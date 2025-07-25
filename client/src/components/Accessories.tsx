import { useQuery } from '@tanstack/react-query';
import type { Product } from '@shared/schema';
import { ProductCard } from './ProductCard';

export function Accessories() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const accessoryProducts = products?.filter(p => p.category === 'accessories') || [];
  
  const safetyTips = [
    "Always check for leaks",
    "Store in ventilated areas", 
    "Regular maintenance",
    "Professional installation"
  ];

  if (isLoading) {
    return (
      <section id="accessories" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-3xl md:text-4xl text-center mb-16">LPG Accessories</h2>
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-6">
                <div className="bg-gray-300 h-48 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="accessories" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title text-3xl md:text-4xl text-center mb-16">LPG Accessories</h2>
        
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {accessoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="feature-icon w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl">
              <i className="fas fa-wrench"></i>
            </div>
            <h5 className="text-xl font-semibold mb-6">Professional Installation</h5>
            <p className="text-gray-600 mb-4">Get expert installation services for all your LPG accessories</p>
            <div className="space-y-2 text-left">
              <p className="flex items-center"><i className="fas fa-check text-green-500 mr-3"></i>Certified technicians</p>
              <p className="flex items-center"><i className="fas fa-check text-green-500 mr-3"></i>Safety compliance</p>
              <p className="flex items-center"><i className="fas fa-check text-green-500 mr-3"></i>Warranty included</p>
            </div>
            <a href="https://wa.me/263713314920" className="btn-primary mt-4 inline-block px-6 py-2 rounded-lg">
              Book Installation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
