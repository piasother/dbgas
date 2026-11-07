import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { LOCATIONS, PHONE, PHONE_DISPLAY, WHATSAPP_URL, EMAIL, mapUrl } from '@/lib/locations';

export function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    inquiryType: '',
    message: ''
  });

  const inquiryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/inquiries', data);
    },
    onSuccess: () => {
      toast({
        title: "Inquiry Sent Successfully",
        description: "Thank you — we'll get back to you as soon as possible during business hours.",
      });
      setFormData({ name: '', phone: '', inquiryType: '', message: '' });
    },
    onError: () => {
      toast({
        title: "Failed to Send Inquiry",
        description: "Please try again or contact us directly via WhatsApp.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.inquiryType || !formData.message) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required to submit your inquiry.",
        variant: "destructive",
      });
      return;
    }
    inquiryMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="contact" className="py-20 bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Get in Touch</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              {LOCATIONS.map((loc) => (
                <div key={loc.label} className="bg-white text-gray-800 rounded-lg p-5 flex flex-col">
                  <i className={`${loc.icon} text-primary text-xl mb-3`}></i>
                  <h5 className="text-base font-semibold text-primary">{loc.label}</h5>
                  <p className="text-sm text-gray-500 mb-3">{loc.sub}</p>
                  <p className="text-sm leading-relaxed mb-3">
                    {loc.lines.map((line) => (
                      <span key={line}>{line}<br /></span>
                    ))}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <i className="fas fa-clock mr-2"></i>{loc.hours}
                  </p>
                  <a
                    href={mapUrl(loc.mapQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary font-semibold hover:underline mt-auto"
                  >
                    <i className="fas fa-directions mr-2"></i>Get directions
                  </a>
                </div>
              ))}
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h6 className="flex items-center font-semibold mb-2">
                  <i className="fas fa-phone mr-3"></i>Phone
                </h6>
                <p><a href={`tel:${PHONE}`} className="hover:underline">{PHONE_DISPLAY}</a></p>
              </div>
              <div>
                <h6 className="flex items-center font-semibold mb-2">
                  <i className="fas fa-envelope mr-3"></i>Email
                </h6>
                <p><a href={`mailto:${EMAIL}`} className="hover:underline">{EMAIL}</a></p>
              </div>
              <div>
                <h6 className="flex items-center font-semibold mb-2">
                  <i className="fab fa-whatsapp mr-3"></i>WhatsApp
                </h6>
                <p><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">{PHONE_DISPLAY}</a></p>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white text-gray-800 rounded-lg">
              <div className="bg-gray-50 px-6 py-4 rounded-t-lg">
                <h5 className="font-semibold">Quick Inquiry</h5>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="Your Name" 
                    required 
                  />
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="Phone Number" 
                    required 
                  />
                  <select 
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Inquiry Type</option>
                    <option value="residential">Residential Supply</option>
                    <option value="commercial">Commercial Solutions</option>
                    <option value="installation">Installation Service</option>
                    <option value="wholesale">Wholesale / Bulk LPG</option>
                    <option value="reticulation">Laboratory Gas Reticulation</option>
                  </select>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
                    rows={3} 
                    placeholder="Your Message"
                    required
                  ></textarea>
                  <button 
                    type="submit" 
                    disabled={inquiryMutation.isPending}
                    className="w-full btn-primary py-3 rounded-md font-semibold disabled:opacity-50"
                  >
                    {inquiryMutation.isPending ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
