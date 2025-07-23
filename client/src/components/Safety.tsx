export function Safety() {
  const certifications = [
    {
      icon: "fas fa-shield-alt",
      title: "ZERA Compliance",
      description: "Full compliance with Zimbabwe Energy Regulatory Authority standards for LPG handling and distribution."
    },
    {
      icon: "fas fa-leaf",
      title: "EMA Certified",
      description: "Environmental Management Agency certification ensuring eco-friendly operations and waste management."
    },
    {
      icon: "fas fa-city",
      title: "City Council Licensed",
      description: "Authorized by Bulawayo City Council for commercial LPG operations within municipal boundaries."
    }
  ];

  const complianceBadges = [
    { icon: "fas fa-certificate", title: "ZERA Licensed", subtitle: "Energy Regulatory Authority" },
    { icon: "fas fa-leaf", title: "EMA Certified", subtitle: "Environmental Management" },
    { icon: "fas fa-city", title: "City Licensed", subtitle: "Bulawayo City Council" },
    { icon: "fas fa-shield-alt", title: "ISO Compliant", subtitle: "International Standards" }
  ];

  const resources = [
    { name: "LPG Safety Guide", link: "/safety-guide" },
    { name: "Installation Guide", link: "/installation-guide" },
    { name: "Storage Checklist", link: "/storage-checklist" }
  ];

  return (
    <>
      <section id="safety" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-3xl md:text-4xl text-center mb-16">Safety & Compliance</h2>
          
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            <div className="lg:col-span-3">
              <div className="grid md:grid-cols-2 gap-6">
                {certifications.map((cert, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-md h-full">
                    <h5 className="flex items-center text-lg font-semibold mb-4">
                      <i className={`${cert.icon} text-green-500 mr-3`}></i>
                      {cert.title}
                    </h5>
                    <p className="text-gray-600">{cert.description}</p>
                  </div>
                ))}
                
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h5 className="flex items-center text-lg font-semibold mb-4">
                    <i className="fas fa-download text-primary mr-3"></i>
                    Download Resources
                  </h5>
                  <div className="space-y-3">
                    {resources.map((resource, index) => (
                      <a 
                        key={index}
                        href={resource.link} 
                        className="btn-outline-primary block text-center py-2 px-4 text-sm rounded-md transition-colors duration-200"
                      >
                        {resource.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <img 
                src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Safety Equipment" 
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Badges */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {complianceBadges.map((badge, index) => (
              <div key={index} className="text-center">
                <div className="compliance-badge">
                  <i className={badge.icon}></i>
                </div>
                <h6 className="font-semibold text-gray-800">{badge.title}</h6>
                <p className="text-sm text-gray-600">{badge.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
