import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
        description: "We'll get back to you within 2 hours during business hours.",
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
            
            <div className="flex justify-center">
              <div className="bg-white text-gray-800 rounded-lg p-6 max-w-md">
                <h5 className="flex items-center text-lg font-semibold mb-4">
                  <i className="fas fa-map-marker-alt text-primary mr-3"></i>
                  Bulawayo Office
                </h5>
                <p className="mb-2">Stand 12142A, Ascot Township<br/>Ascot Shopping Centre, Bulawayo</p>
                <p><strong>Hours:</strong> Mon-Fri 8AM-6PM, Sun 8AM-1PM<br/>Closed on Saturday</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h6 className="flex items-center font-semibold mb-2">
                  <i className="fas fa-phone mr-3"></i>Emergency
                </h6>
                <p>0713314920</p>
              </div>
              <div>
                <h6 className="flex items-center font-semibold mb-2">
                  <i className="fas fa-envelope mr-3"></i>Email
                </h6>
                <p>info@dbgas.co.zw</p>
              </div>
              <div>
                <h6 className="flex items-center font-semibold mb-2">
                  <i className="fab fa-whatsapp mr-3"></i>WhatsApp
                </h6>
                <p>0713314920</p>
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
                    <option value="emergency">Emergency Service</option>
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
