import { useState } from 'react';
import { Link } from 'wouter';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Cart } from './Cart';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import logoImage from '@assets/F2636034-1A6C-48F3-81E1-8BD700485FD6_1749105674186.png';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems, getTotalPrice } = useCart();
  const { user, isAuthenticated } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cart Indicator */}
      <div 
        className="cart-indicator"
        onClick={() => setIsCartOpen(true)}
      >
        <i className="fas fa-shopping-cart mr-2"></i>
        <span>{getTotalItems()}</span> Items - ${(getTotalPrice() / 100).toFixed(2)}
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <img 
                  src={logoImage} 
                  alt="DB Gas - Energy for Life" 
                  className="h-10 w-auto mr-2"
                />
                <span className="text-xl font-bold text-primary">DB Gas</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <button onClick={() => scrollToSection('home')} className="nav-link">Home</button>
                <button onClick={() => scrollToSection('about')} className="nav-link">About Us</button>
                <button onClick={() => scrollToSection('services')} className="nav-link">Services</button>
                <button onClick={() => scrollToSection('shop')} className="nav-link">Shop Online</button>
                <button onClick={() => scrollToSection('commercial')} className="nav-link">Commercial</button>
                <button onClick={() => scrollToSection('accessories')} className="nav-link">Accessories</button>
                <button onClick={() => scrollToSection('safety')} className="nav-link">Safety</button>
                <button onClick={() => scrollToSection('contact')} className="nav-link">Contact</button>
                
                {/* Authentication Controls */}
                <div className="ml-4 border-l pl-4">
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-2">
                      <Link href="/account">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Account
                        </Button>
                      </Link>
                      <Link href="/inventory">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <i className="fas fa-boxes h-4 w-4"></i>
                          Inventory
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.location.href = "/api/logout"}
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => window.location.href = "/api/login"}
                    >
                      Login
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-primary hover:text-secondary p-2"
              >
                <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
                <button onClick={() => scrollToSection('home')} className="mobile-nav-link">Home</button>
                <button onClick={() => scrollToSection('about')} className="mobile-nav-link">About Us</button>
                <button onClick={() => scrollToSection('services')} className="mobile-nav-link">Services</button>
                <button onClick={() => scrollToSection('shop')} className="mobile-nav-link">Shop Online</button>
                <button onClick={() => scrollToSection('commercial')} className="mobile-nav-link">Commercial</button>
                <button onClick={() => scrollToSection('accessories')} className="mobile-nav-link">Accessories</button>
                <button onClick={() => scrollToSection('safety')} className="mobile-nav-link">Safety</button>
                <button onClick={() => scrollToSection('contact')} className="mobile-nav-link">Contact</button>
                
                {/* Mobile Authentication Controls */}
                <div className="border-t pt-2 mt-2">
                  {isAuthenticated ? (
                    <div className="space-y-1">
                      <Link href="/account">
                        <button className="mobile-nav-link flex items-center gap-2">
                          <User className="h-4 w-4" />
                          My Account
                        </button>
                      </Link>
                      <Link href="/inventory">
                        <button className="mobile-nav-link flex items-center gap-2">
                          <i className="fas fa-boxes h-4 w-4"></i>
                          Inventory
                        </button>
                      </Link>
                      <button 
                        className="mobile-nav-link text-red-600"
                        onClick={() => window.location.href = "/api/logout"}
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="mobile-nav-link text-blue-600 font-semibold"
                      onClick={() => window.location.href = "/api/login"}
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src={logoImage} 
                alt="DB Gas - Energy for Life" 
                className="h-8 w-auto mr-2 filter brightness-0 invert"
              />
              <h5 className="text-xl font-bold">DB Gas</h5>
            </div>
            <div className="text-center md:text-right">
              <p className="mb-1">&copy; 2024 DB Gas. All rights reserved.</p>
              <p className="text-sm text-gray-400">Licensed by ZERA, EMA & Bulawayo City Council</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold">Fueling Zimbabwe Safely — From Homes to Industry</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float Button */}
      <a 
        href="https://wa.me/263771234567" 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-float"
      >
        <i className="fab fa-whatsapp mr-2"></i>
        WhatsApp Us
      </a>

      {/* Cart Sidebar */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />


    </div>
  );
}
