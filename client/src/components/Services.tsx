import { BookInstallation, BOOKING_SERVICES } from './BookInstallation';
export function Services() {
  const services = [
    {
      icon: "fas fa-gas-pump",
      title: "Cylinder Refills",
      description: "Quick refills for 9kg, 19kg and 48kg cylinders at $1.95/kg."
    },
    {
      icon: "fas fa-truck",
      title: "Wholesale Supply",
      description: "Bulk LPG from our 25-tonne storage for commercial customers, from $1.55/kg."
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

        {/* Laboratory & specialty gas reticulation */}
        <div className="mt-16 rounded-3xl bg-white shadow-lg overflow-hidden grid lg:grid-cols-5">
          <div className="lg:col-span-3 p-8 md:p-10">
            <span className="inline-block text-xs font-semibold uppercase tracking-wide text-secondary mb-3">New service</span>
            <h3 className="text-2xl md:text-3xl font-bold text-primary mb-4">University &amp; Laboratory Gas Reticulation</h3>
            <p className="text-gray-600 mb-6">
              Design, supply and installation of piped gas systems for universities, laboratories, hospitals and workshops -
              from the cylinder manifold to every bench outlet, pressure-tested and certified.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {["LPG", "Argon", "Nitrogen", "Compressed air", "Oxygen", "CO₂", "Specialty gas mixtures"].map((g) => (
                <span key={g} className="px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-sm font-medium">{g}</span>
              ))}
            </div>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-gray-700 mb-8">
              {[
                "Copper & stainless gas lines",
                "Cylinder manifolds & changeover",
                "Bench outlets, regulators & valves",
                "Leak & pressure testing with certificate",
              ].map((t) => (
                <li key={t} className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-2 mt-1"></i>
                  {t}
                </li>
              ))}
            </ul>
            <BookInstallation
              defaultService={BOOKING_SERVICES[2]}
              className="btn-primary px-6 py-3 rounded-lg font-semibold inline-flex items-center"
            >
              <i className="fas fa-clipboard-list mr-2"></i>
              Request a Site Survey
            </BookInstallation>
          </div>
          <div className="lg:col-span-2 hero-gradient text-white p-8 md:p-10 flex flex-col justify-center">
            <p className="text-sm uppercase tracking-wide text-blue-200 mb-2">Who we work with</p>
            <ul className="space-y-3 text-lg">
              <li><i className="fas fa-university mr-3 text-blue-200"></i>Universities &amp; colleges</li>
              <li><i className="fas fa-flask mr-3 text-blue-200"></i>Research &amp; testing laboratories</li>
              <li><i className="fas fa-hospital mr-3 text-blue-200"></i>Hospitals &amp; clinics</li>
              <li><i className="fas fa-industry mr-3 text-blue-200"></i>Workshops &amp; light industry</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
