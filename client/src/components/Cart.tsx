import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();
  const { toast } = useToast();
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerData, setCustomerData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    paymentMethod: ''
  });

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: () => {
      toast({
        title: "Order Placed Successfully!",
        description: "We'll contact you within 2 hours to confirm delivery details.",
      });
      clearCart();
      setShowCheckout(false);
      onClose();
      setCustomerData({ customerName: '', customerPhone: '', deliveryAddress: '', paymentMethod: '' });
    },
    onError: () => {
      toast({
        title: "Failed to Place Order",
        description: "Please try again or contact us via WhatsApp.",
        variant: "destructive",
      });
    }
  });

  const handleCheckout = () => {
    if (items.length === 0) {
      toast({
        title: "Your cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }
    setShowCheckout(true);
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData.customerName || !customerData.customerPhone || !customerData.deliveryAddress || !customerData.paymentMethod) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required to place your order.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      ...customerData,
      items: JSON.stringify(items),
      totalAmount: getTotalPrice()
    };

    orderMutation.mutate(orderData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCustomerData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={onClose}
        ></div>
      )}

      {/* Cart Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {!showCheckout ? (
          // Cart View
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-semibold">Shopping Cart</h4>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty</p>
            ) : (
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.product.id} className="border rounded-lg p-4">
                    <div className="flex">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded-lg mr-4"
                      />
                      <div className="flex-1">
                        <h6 className="font-semibold">{item.product.name}</h6>
                        <p className="text-gray-600 text-sm">${(item.product.price / 100).toFixed(2)} each</p>
                        <div className="flex items-center mt-2">
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="btn btn-sm btn-outline-secondary px-2 py-1"
                          >
                            -
                          </button>
                          <span className="mx-3">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="btn btn-sm btn-outline-secondary px-2 py-1"
                          >
                            +
                          </button>
                          <button 
                            onClick={() => removeItem(item.product.id)}
                            className="ml-auto text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <strong className="text-lg">Total: ${(getTotalPrice() / 100).toFixed(2)}</strong>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="btn-primary w-full py-3 rounded-lg font-semibold mb-3"
                >
                  Proceed to Checkout
                </button>
                <button 
                  onClick={clearCart}
                  className="btn-outline-secondary w-full py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        ) : (
          // Checkout View
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-semibold">Checkout</h4>
              <button 
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
            </div>

            {/* Order Summary */}
            <div className="mb-6">
              <h6 className="font-semibold mb-3">Order Summary</h6>
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm mb-2">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>${((item.product.price * item.quantity) / 100).toFixed(2)}</span>
                </div>
              ))}
              <hr className="my-3" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${(getTotalPrice() / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Information Form */}
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <h6 className="font-semibold">Customer Information</h6>
              
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="customerName"
                  value={customerData.customerName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="Full Name" 
                  required 
                />
                <input 
                  type="tel" 
                  name="customerPhone"
                  value={customerData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="Phone Number" 
                  required 
                />
              </div>
              
              <textarea 
                name="deliveryAddress"
                value={customerData.deliveryAddress}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
                rows={3} 
                placeholder="Delivery Address" 
                required
              ></textarea>
              
              <select 
                name="paymentMethod"
                value={customerData.paymentMethod}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Payment Method</option>
                <option value="ecocash">EcoCash</option>
                <option value="usd">USD Cash</option>
                <option value="bank">Bank Transfer</option>
              </select>

              {/* Delivery Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h6 className="font-semibold mb-2">Delivery Information</h6>
                <p className="text-sm mb-1"><i className="fas fa-clock mr-2"></i>2-hour delivery</p>
                <p className="text-sm mb-1"><i className="fas fa-shield-alt mr-2"></i>ZERA certified</p>
                <p className="text-sm mb-3"><i className="fas fa-phone mr-2"></i>24/7 support</p>
                
                <a 
                  href="https://wa.me/263771234567" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold inline-flex items-center w-full justify-center"
                >
                  <i className="fab fa-whatsapp mr-2"></i>
                  Need Help? WhatsApp Us
                </a>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 btn-outline-secondary py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Continue Shopping
                </button>
                <button 
                  type="submit"
                  disabled={orderMutation.isPending}
                  className="flex-1 btn-primary py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {orderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
