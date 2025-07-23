import dbGasLogo from "@assets/F2636034-1A6C-48F3-81E1-8BD700485FD6_1749105674186.png";

export function Hero() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero-gradient text-white py-24 relative overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 hero-overlay"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-center mb-6">
              <img 
                src={dbGasLogo} 
                alt="DB Gas - Energy for Life" 
                className="h-20 w-auto mr-4"
              />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Fueling Zimbabwe Safely — From Homes to Industry
            </h1>
            <p className="text-lg md:text-xl text-blue-100">
              Reliable LPG supply across Zimbabwe with 2-hour delivery, professional installations, and ZERA-compliant safety standards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => scrollToSection('shop')}
                className="btn-primary px-8 py-4 text-lg font-semibold rounded-lg inline-flex items-center justify-center"
              >
                <i className="fas fa-shopping-cart mr-2"></i>
                Order Gas Now
              </button>
              <button 
                onClick={() => scrollToSection('accessories')}
                className="btn-outline-primary px-8 py-4 text-lg font-semibold rounded-lg inline-flex items-center justify-center border-white text-white hover:bg-white hover:text-primary"
              >
                <i className="fas fa-tools mr-2"></i>
                Shop Accessories
              </button>
              <button 
                onClick={() => scrollToSection('commercial')}
                className="btn-outline-primary px-8 py-4 text-lg font-semibold rounded-lg inline-flex items-center justify-center border-white text-white hover:bg-white hover:text-primary"
              >
                <i className="fas fa-building mr-2"></i>
                Commercial Solutions
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <img 
              src="/api/static/images/lpg-storage-facility-zimbabwe.jpg" 
              alt="DB Gas LPG Storage Facility in Zimbabwe" 
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
