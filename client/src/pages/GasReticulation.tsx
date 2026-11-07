import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PHONE, PHONE_DISPLAY, WHATSAPP_URL } from "@/lib/locations";

const PAGE_TITLE = "LPG Gas Reticulation & Piping Installation in Bulawayo | DB Gas";

const uses = [
  { icon: "fas fa-utensils", title: "Commercial Kitchens", text: "Hotels, lodges, restaurants and canteens: stoves, ovens, fryers and boilers on one metered supply." },
  { icon: "fas fa-flask", title: "Universities & Laboratories", text: "Lab gas points, Bunsen burner benches and isolation valves for teaching and research spaces." },
  { icon: "fas fa-trophy", title: "Sports & Leisure Venues", text: "Clubhouse kitchens, braai areas and water heating for venues that need reliable gas every day." },
  { icon: "fas fa-home", title: "Homes", text: "Household installations for gas stoves, geysers and heaters, with the cylinder safely outside." },
];

// Completed reticulation jobs — add new ones here.
const projects = [
  { tag: "Hospitality", name: "Cresta Hotel, Bulawayo", text: "Gas reticulation for hotel kitchen operations." },
  { tag: "Commercial", name: "Kings City, Bulawayo", text: "Commercial gas reticulation installation." },
  { tag: "Sports & Leisure", name: "Padel Bulawayo", text: "Gas reticulation for the venue's facilities." },
  { tag: "Education", name: "NUST Main Campus", text: "Gas reticulation at the National University of Science and Technology main campus." },
  { tag: "Education", name: "NUST Town Campus", text: "Gas reticulation at NUST's town campus." },
  { tag: "Residential", name: "Household Installations", text: "Gas stove, geyser and heater installations for homes across Bulawayo." },
];

const included = [
  "Site visit, load calculation and pipe routing to every appliance",
  "Bulk LPG tanks, cylinder manifolds and changeover valves",
  "Regulators, gas meters and isolation valves",
  "Copper and steel gas pipework and appliance hook-ups",
  "Leak and pressure testing before handover",
  "Help with ZERA and Bulawayo City Council requirements",
  "Ongoing LPG supply on account after installation",
  "Repairs, inspections and system extensions",
];

const steps = [
  { n: 1, title: "Site Visit", text: "We inspect the premises and list every gas appliance." },
  { n: 2, title: "Quotation", text: "A clear quote for materials, labour and testing." },
  { n: 3, title: "Installation", text: "Our technicians install the tank, pipework and connections." },
  { n: 4, title: "Test & Hand Over", text: "Pressure test, safety check and a walk-through for your staff." },
];

const faqs = [
  { q: "Do you install gas reticulation outside Bulawayo?", a: "Yes. We are based in Bulawayo and also take on reticulation projects elsewhere in Zimbabwe. Contact us with your location." },
  { q: "Can you supply the gas as well as install the system?", a: "Yes. DB Gas is an LPG retailer and wholesaler, so we can keep your tank or cylinders filled on account after installation." },
  { q: "Do I need council or ZERA approval?", a: "Commercial and bulk installations usually need approvals. We advise on what your site needs and help prepare for inspections." },
  { q: "Can you fix or extend an existing gas system?", a: "Yes. We repair leaks, replace regulators and valves, and extend existing reticulation to new appliances." },
];

export function GasReticulation() {
  const quoteUrl = `${WHATSAPP_URL}?text=${encodeURIComponent("Hi DB Gas, I'd like a quote for gas reticulation")}`;

  useEffect(() => {
    document.title = PAGE_TITLE;
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <PageHeader
        title="Gas Reticulation"
        description="LPG piping installations for hotels, universities, sports venues and homes in Bulawayo"
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <i className="fas fa-project-diagram text-primary mr-3"></i>
              What is gas reticulation?
            </h2>
            <p className="text-gray-700 mb-6">
              Gas reticulation is a fixed pipe network that carries LPG from a bulk tank or a manifold of cylinders,
              kept safely outside, to your kitchens, laboratories, geysers and heaters. No more moving cylinders indoors,
              fewer refills, steadier pressure, and a safer, tidier installation that meets ZERA and Bulawayo City Council
              requirements.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {uses.map((u) => (
                <div key={u.title} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-primary mb-2 flex items-center">
                    <i className={`${u.icon} mr-3`}></i>
                    {u.title}
                  </h3>
                  <p className="text-sm text-gray-700">{u.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <i className="fas fa-check-circle text-primary mr-3"></i>
              Reticulation Projects We Have Completed
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {projects.map((p) => (
                <div key={p.name} className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">{p.tag}</p>
                  <h3 className="text-lg font-semibold text-primary mb-2">{p.name}</h3>
                  <p className="text-sm text-gray-700">{p.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <i className="fas fa-tools text-primary mr-3"></i>
              What's Included
            </h2>
            <ul className="grid md:grid-cols-2 gap-2">
              {included.map((item) => (
                <li key={item} className="flex items-start">
                  <i className="fas fa-check text-green-500 mr-3 mt-1"></i>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8 mb-12">
            {steps.map((st) => (
              <div key={st.n} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                    {st.n}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{st.title}</h3>
                    <p className="text-gray-600">{st.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <i className="fas fa-question-circle text-primary mr-3"></i>
              Gas Reticulation FAQs
            </h2>
            <div className="space-y-2">
              {faqs.map((f) => (
                <details key={f.q} className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer">{f.q}</summary>
                  <p className="text-sm text-gray-700 mt-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="bg-primary text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Get a Gas Reticulation Quote</h2>
            <p className="mb-6">Tell us about your property and appliances and we'll arrange a site visit.</p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <i className="fas fa-certificate text-3xl mb-2"></i>
                <p className="font-semibold">ZERA Compliant</p>
              </div>
              <div>
                <i className="fas fa-shield-alt text-3xl mb-2"></i>
                <p className="font-semibold">Pressure Tested</p>
              </div>
              <div>
                <i className="fas fa-gas-pump text-3xl mb-2"></i>
                <p className="font-semibold">Gas Supply on Account</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={quoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold inline-flex items-center justify-center hover:bg-gray-100"
              >
                <i className="fab fa-whatsapp mr-2"></i>WhatsApp for a Quote
              </a>
              <a
                href={`tel:${PHONE}`}
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold inline-flex items-center justify-center hover:bg-gray-100"
              >
                <i className="fas fa-phone mr-2"></i>Call {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
