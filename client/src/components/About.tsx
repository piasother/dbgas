export function About() {
  return (
    <section id="about" className="py-20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="section-title text-3xl md:text-4xl mb-12">About DB Gas</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Leading LPG supplier in Zimbabwe, serving residential and commercial customers with reliable, safe energy solutions since establishment.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div>
                <h5 className="flex items-center text-lg font-semibold mb-3">
                  <i className="fas fa-certificate text-primary mr-3"></i>
                  Fully Licensed
                </h5>
                <p className="text-gray-600">Licensed by ZERA, EMA, and Bulawayo City Council for complete compliance.</p>
              </div>
              <div>
                <h5 className="flex items-center text-lg font-semibold mb-3">
                  <i className="fas fa-tools text-primary mr-3"></i>
                  Professional Equipment
                </h5>
                <p className="text-gray-600">TLB machinery, thrust boring units, mobile refill trailers, and cylinder cages.</p>
              </div>
            </div>
            
            <div className="mt-8">
              <h5 className="text-lg font-semibold mb-3">Our Mission</h5>
              <p className="text-gray-600">
                To provide safe, reliable, and affordable LPG solutions that power Zimbabwe's homes and industries while maintaining the highest safety standards.
              </p>
            </div>
          </div>
          
          <div>
            <img 
              src="/images/installation-team-dummy.svg" 
              alt="DB Gas Professional Installation Team in Zimbabwe" 
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
