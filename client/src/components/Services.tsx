export function Services() {
  const services = [
    {
      icon: "fas fa-gas-pump",
      title: "Cylinder Refills",
      description: "Quick refills for 9kg, 19kg, and 48kg cylinders with same-day service."
    },
    {
      icon: "fas fa-truck",
      title: "Wholesale Supply",
      description: "Bulk LPG supply from our 25-tonne skid tanks for commercial customers."
    },
    {
      icon: "fas fa-wrench",
      title: "Tank Installations",
      description: "Professional LPG tank installations for commercial and residential properties."
    },
    {
      icon: "fas fa-shield-alt",
      title: "Safety Audits",
      description: "ZERA compliance support and comprehensive safety audits for businesses."
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title text-3xl md:text-4xl text-center mb-16">Our Services</h2>
        
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="text-center">
              <div className="feature-icon w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl">
                <i className={service.icon}></i>
              </div>
              <h5 className="text-xl font-semibold mb-4">{service.title}</h5>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
