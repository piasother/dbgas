import { Layout } from "@/components/Layout";

export function SafetyGuide() {
  const safetyRules = [
    {
      icon: "fas fa-search",
      title: "Regular Leak Checks",
      description: "Use soapy water to check all connections monthly. Bubbles indicate gas leaks.",
      steps: [
        "Mix liquid soap with water in a spray bottle",
        "Spray on all connections and joints",
        "Look for bubbles forming",
        "If bubbles appear, tighten connections or call a professional"
      ]
    },
    {
      icon: "fas fa-wind",
      title: "Proper Ventilation",
      description: "Always ensure adequate ventilation when using LPG appliances.",
      steps: [
        "Keep windows open during cooking",
        "Never use LPG appliances in enclosed spaces",
        "Install exhaust fans in kitchens",
        "Ensure air vents are not blocked"
      ]
    },
    {
      icon: "fas fa-warehouse",
      title: "Safe Storage",
      description: "Store LPG cylinders in well-ventilated, upright positions away from heat sources.",
      steps: [
        "Store cylinders upright and secure",
        "Keep away from heat sources and direct sunlight",
        "Store in well-ventilated areas",
        "Never store cylinders indoors or in basements"
      ]
    },
    {
      icon: "fas fa-tools",
      title: "Professional Installation",
      description: "Always use certified technicians for LPG system installation and maintenance.",
      steps: [
        "Use only certified LPG technicians",
        "Get regular system inspections",
        "Replace old hoses and regulators",
        "Keep installation certificates"
      ]
    }
  ];

  const emergencyProcedures = [
    {
      situation: "Gas Leak Detected",
      actions: [
        "Turn off the gas supply immediately",
        "Do NOT use electrical switches or create sparks",
        "Ventilate the area by opening doors and windows",
        "Evacuate the premises if leak is severe",
        "Call emergency services: 0713314920"
      ]
    },
    {
      situation: "Fire Emergency",
      actions: [
        "Turn off gas supply if safely possible",
        "Call fire department immediately",
        "Evacuate all persons from the area",
        "Use appropriate fire extinguisher (never water)",
        "Do not re-enter until cleared by authorities"
      ]
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">LPG Safety Guide</h1>
            <p className="text-xl text-gray-600">
              Essential safety information for LPG usage in Zimbabwe
            </p>
          </div>

          {/* Safety Rules */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {safetyRules.map((rule, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                    <i className={`${rule.icon} text-white text-xl`}></i>
                  </div>
                  <h3 className="text-xl font-semibold">{rule.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{rule.description}</p>
                <ol className="list-decimal list-inside space-y-2">
                  {rule.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-sm text-gray-700">{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* Emergency Procedures */}
          <div className="bg-red-50 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-red-800 mb-6 flex items-center">
              <i className="fas fa-exclamation-triangle mr-3"></i>
              Emergency Procedures
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {emergencyProcedures.map((procedure, index) => (
                <div key={index} className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-700 mb-4">{procedure.situation}</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {procedure.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="text-sm text-gray-700">{action}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-primary text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
            <p className="mb-6">For emergencies or safety concerns, contact us immediately</p>
            <div className="flex justify-center space-x-8">
              <div>
                <i className="fas fa-phone text-2xl mb-2"></i>
                <p className="font-semibold">Emergency: 0713314920</p>
              </div>
              <div>
                <i className="fab fa-whatsapp text-2xl mb-2"></i>
                <p className="font-semibold">WhatsApp: 0713314920</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}