import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Cart } from './Cart';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { LOCATIONS, PHONE, PHONE_DISPLAY, WHATSAPP_URL, EMAIL } from '@/lib/locations';
import logoImage from '@assets/F2636034-1A6C-48F3-81E1-8BD700485FD6_1749105674186.png';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { getTotalItems, getTotalPrice } = useCart();
  const { user, isAuthenticated } = useAuth();

  // About / Services / Shop / Contact are sections of the home page.
  // On the home page: close the menu first, then scroll (so the mobile menu
  // collapsing doesn't throw the position off). On any other page: go to the
  // home page with the section in the URL, and scroll there once it renders.
  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    if (document.getElementById(sectionId)) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return;
    }
    window.location.href = `/#${sectionId}`;
  };

  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (!sectionId) return;
    let tries = 0;
    const timer = setInterval(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        clearInterval(timer);
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (++tries > 25) {
        clearInterval(timer);
      }
    }, 120);
    return () => clearInterval(timer);
  }, []);

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
                <span className="text-xl font-bold text-primary whitespace-nowrap">DB Gas</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/" className="nav-link">Home</Link>
                <button onClick={() => scrollToSection('about')} className="nav-link">About Us</button>
                <button onClick={() => scrollToSection('services')} className="nav-link">Services</button>
                <Link href="/gas-reticulation" className="nav-link">Reticulation</Link>
                <button onClick={() => scrollToSection('shop')} className="nav-link">Shop Online</button>
                <Link href="/safety-guide" className="nav-link">Safety Guide</Link>
                <Link href="/installation-guide" className="nav-link">Installation</Link>
                <Link href="/storage-checklist" className="nav-link">Storage Guide</Link>
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
                      {['admin', 'staff'].includes((user as any)?.role) && (
                        <Link href="/admin">
                          <Button variant="outline" size="sm" className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50">
                            <i className="fas fa-shield-alt h-4 w-4"></i>
                            {(user as any)?.role === 'staff' ? 'Staff' : 'Admin'}
                          </Button>
                        </Link>
                      )}
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
                <Link href="/" className="mobile-nav-link">Home</Link>
                <button onClick={() => scrollToSection('about')} className="mobile-nav-link">About Us</button>
                <button onClick={() => scrollToSection('services')} className="mobile-nav-link">Services</button>
                <Link href="/gas-reticulation" className="mobile-nav-link">Gas Reticulation</Link>
                <button onClick={() => scrollToSection('shop')} className="mobile-nav-link">Shop Online</button>
                <Link href="/safety-guide" className="mobile-nav-link">Safety Guide</Link>
                <Link href="/installation-guide" className="mobile-nav-link">Installation</Link>
                <Link href="/storage-checklist" className="mobile-nav-link">Storage Guide</Link>
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
                      {['admin', 'staff'].includes((user as any)?.role) && (
                      <Link href="/inventory">
                        <button className="mobile-nav-link flex items-center gap-2">
                          <i className="fas fa-boxes h-4 w-4"></i>
                          Inventory Management
                        </button>
                      </Link>
                      )}
                      <Link href="/checkout">
                        <button className="mobile-nav-link flex items-center gap-2">
                          <i className="fas fa-shopping-cart h-4 w-4"></i>
                          Checkout
                        </button>
                      </Link>
                      {['admin', 'staff'].includes((user as any)?.role) && (
                        <Link href="/admin">
                          <button className="mobile-nav-link flex items-center gap-2 text-red-700">
                            <i className="fas fa-shield-alt h-4 w-4"></i>
                            Admin Panel
                          </button>
                        </Link>
                      )}
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
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="bg-white rounded-md p-1 mr-3 inline-flex">
                  <img src={logoImage} alt="DB Gas - Energy for Life" className="h-8 w-auto" />
                </span>
                <h5 className="text-xl font-bold">DB Gas</h5>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                Fueling Zimbabwe Safely — From Homes to Industry. LPG retail, wholesale, accessories and gas reticulation.
              </p>
              <p className="text-xs text-gray-500">Licensed by ZERA, EMA &amp; Bulawayo City Council</p>
            </div>

            <div>
              <h6 className="footer-heading mb-4">Quick Links</h6>
              <ul className="space-y-2 text-sm">
                <li><Link href="/inventory" className="footer-link">Shop Online</Link></li>
                <li><Link href="/gas-reticulation" className="footer-link">Gas Reticulation</Link></li>
                <li><Link href="/installation-guide" className="footer-link">Installation Guide</Link></li>
                <li><Link href="/safety-guide" className="footer-link">Safety Guide</Link></li>
                <li><Link href="/storage-checklist" className="footer-link">Storage Checklist</Link></li>
              </ul>
            </div>

            <div>
              <h6 className="footer-heading mb-4">Our Locations</h6>
              <ul className="space-y-3 text-sm">
                {LOCATIONS.map((loc) => (
                  <li key={loc.label}>
                    <span className="font-semibold">{loc.label}</span><br />
                    <span className="text-gray-400">{loc.lines.join(', ')}</span><br />
                    <span className="text-gray-500 text-xs">{loc.hours}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h6 className="footer-heading mb-4">Contact</h6>
              <ul className="space-y-2 text-sm">
                <li><a href={`tel:${PHONE}`} className="footer-link"><i className="fas fa-phone mr-2"></i>{PHONE_DISPLAY}</a></li>
                <li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="footer-link"><i className="fab fa-whatsapp mr-2"></i>WhatsApp us</a></li>
                <li><a href={`mailto:${EMAIL}`} className="footer-link"><i className="fas fa-envelope mr-2"></i>{EMAIL}</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-divider mt-8 pt-6 text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} DB Gas, a division of DREWBULLE Supplies (Pvt) Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Float Button */}
      <a 
        href="https://wa.me/263713314920" 
        target="_blank" 
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="Chat with DB Gas on WhatsApp"
      >
        <i className="fab fa-whatsapp sm:mr-2 text-xl sm:text-base align-middle"></i>
        <span className="hidden sm:inline">WhatsApp Us</span>
      </a>

      {/* Cart Sidebar */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />


    </div>
  );
}
