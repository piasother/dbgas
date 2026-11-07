import { useSiteImage } from "@/hooks/useSiteImages";
export function About() {
  const aboutImage = useSiteImage("about");
  return (
    <section id="about" className="py-20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="section-title text-3xl md:text-4xl mb-12">About DB Gas</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              A Bulawayo-based LPG supplier serving homes, businesses and institutions across Zimbabwe with reliable, safe energy solutions since 2018.
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
              src={aboutImage} 
              alt="DB Gas Professional Installation Team in Zimbabwe" 
              className="w-full h-auto rounded-3xl shadow-lg object-cover aspect-[640/460]" width={640} height={460}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
