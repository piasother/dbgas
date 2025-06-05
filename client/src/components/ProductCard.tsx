import { type Product } from '@shared/schema';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    console.log('Adding to cart:', product.name);
    setIsAdding(true);
    try {
      addItem(product);
      console.log('Successfully added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
    
    // Show visual feedback
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  return (
    <div className="product-card bg-white h-full">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-48 object-cover rounded-t-2xl"
      />
      <div className="p-6">
        {product.badge && (
          <span className="badge-safety inline-block mb-3">{product.badge}</span>
        )}
        <h5 className="text-xl font-semibold mb-3">{product.name}</h5>
        <p className="text-gray-600 mb-4">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="price-tag">${(product.price / 100).toFixed(2)}</span>
          <button 
            onClick={handleAddToCart}
            disabled={isAdding || !product.inStock}
            className={`btn-primary px-4 py-2 rounded-lg font-semibold inline-flex items-center ${
              isAdding ? 'opacity-75 cursor-not-loading' : ''
            } ${!product.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <i className={`fas ${isAdding ? 'fa-spinner fa-spin' : 'fa-cart-plus'} mr-2`}></i>
            {isAdding ? 'Adding...' : !product.inStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
