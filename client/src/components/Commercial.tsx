export function Commercial() {
  const industries = [
    {
      icon: "fas fa-bread-slice",
      title: "Bakeries & Restaurants",
      description: "Professional LPG ovens, fryers, and cooking equipment for commercial kitchens."
    },
    {
      icon: "fas fa-seedling",
      title: "Dairy & Poultry Farms",
      description: "Reliable heating solutions for boilers, heaters, and agricultural processes."
    },
    {
      icon: "fas fa-hotel",
      title: "Lodges & Hotels",
      description: "Complete LPG systems for hot water, kitchen operations, and heating."
    },
    {
      icon: "fas fa-hospital",
      title: "Schools & Hospitals",
      description: "Bulk tank installations for institutional cooking and heating needs."
    }
  ];

  const handleSiteVisitRequest = () => {
    // Scroll to contact form or open WhatsApp
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="commercial" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title text-3xl md:text-4xl text-center mb-16">Commercial Applications</h2>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
          <div>
            <h3 className="text-2xl font-semibold mb-8">Industries We Serve</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {industries.map((industry, index) => (
                <div key={index} className="mb-6">
                  <h5 className="flex items-center text-lg font-semibold mb-3">
                    <i className={`${industry.icon} text-primary mr-3`}></i>
                    {industry.title}
                  </h5>
                  <p className="text-gray-600">{industry.description}</p>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleSiteVisitRequest}
              className="btn-primary px-8 py-4 text-lg font-semibold rounded-lg inline-flex items-center mt-8"
            >
              <i className="fas fa-calendar-check mr-3"></i>
              Request a Free Site Visit
            </button>
          </div>
          
          <div>
            <img 
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Commercial Kitchen" 
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
