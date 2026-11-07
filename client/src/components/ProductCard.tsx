import { type Product } from '@shared/schema';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your cart and track your orders.",
        variant: "default",
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }

    console.log('Adding to cart:', product.name);
    setIsAdding(true);
    try {
      addItem(product);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
        variant: "default",
      });
      console.log('Successfully added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
    
    // Show visual feedback
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };

  return (
    <div className="product-card bg-white h-full flex flex-col overflow-hidden">
      <div className="bg-slate-50 h-48 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.fallback) {
              img.dataset.fallback = "1";
              img.src = "/images/lpg-9kg-cylinder.svg";
            }
          }}
        />
      </div>
      <div className="p-6 flex flex-col flex-1">
        {product.badge && (
          <span className="badge-safety inline-block self-start mb-3">{product.badge}</span>
        )}
        <h5 className="text-xl font-semibold mb-3">{product.name}</h5>
        <p className="text-gray-600 mb-4">{product.description}</p>
        
        {/* Dynamic Stock Indicator */}
        <div className="mb-4">
          {product.stockQuantity > 0 ? (
            <div className="flex items-center space-x-2">
              {product.stockQuantity <= product.lowStockThreshold ? (
                <>
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span className="text-sm text-yellow-600 font-medium">
                    Low Stock: {product.stockQuantity} left
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-green-600 font-medium">
                    In Stock ({product.stockQuantity} available)
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-sm text-red-600 font-medium">
                Out of Stock
                {(product as any).leadTime > 0 && (
                  <span className="text-gray-500 ml-1">
                    (Lead time: {(product as any).leadTime} days)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-auto flex flex-col gap-3">
          <span className="price-tag whitespace-nowrap">${(product.price / 100).toFixed(2)}</span>
          <button 
            onClick={handleAddToCart}
            disabled={isAdding || product.stockQuantity === 0}
            className={`btn-primary w-full px-4 py-2.5 rounded-lg font-semibold inline-flex items-center justify-center whitespace-nowrap ${
              isAdding ? 'opacity-75 cursor-not-loading' : ''
            } ${product.stockQuantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <i className={`fas ${isAdding ? 'fa-spinner fa-spin' : isAuthenticated ? 'fa-cart-plus' : 'fa-sign-in-alt'} mr-2`}></i>
            {isAdding ? 'Adding...' : product.stockQuantity === 0 ? 'Out of Stock' : isAuthenticated ? 'Add to Cart' : 'Login to Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
