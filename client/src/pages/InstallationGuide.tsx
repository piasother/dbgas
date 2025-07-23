import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";

export function InstallationGuide() {
  const installationSteps = [
    {
      step: 1,
      title: "Pre-Installation Safety Check",
      description: "Ensure the installation area meets safety requirements",
      requirements: [
        "Well-ventilated area with adequate airflow",
        "Away from electrical panels and heat sources",
        "Minimum 1.5m from ignition sources",
        "Accessible for maintenance and cylinder changes",
        "Level, stable surface for cylinder placement"
      ]
    },
    {
      step: 2,
      title: "Equipment Preparation",
      description: "Gather all necessary components and tools",
      requirements: [
        "LPG cylinder with safety valve",
        "Pressure regulator (certified for Zimbabwe standards)",
        "LPG hose (appropriate length and rating)",
        "Hose clamps and safety clips",
        "Leak detection solution or spray"
      ]
    },
    {
      step: 3,
      title: "Regulator Installation",
      description: "Connect the pressure regulator to the cylinder",
      requirements: [
        "Ensure cylinder valve is completely closed",
        "Remove protective cap from cylinder valve",
        "Hand-tighten regulator to cylinder valve",
        "Use spanner to secure connection (do not over-tighten)",
        "Check connection is secure but not forced"
      ]
    },
    {
      step: 4,
      title: "Hose Connection",
      description: "Connect the LPG hose to regulator and appliance",
      requirements: [
        "Cut hose to appropriate length (avoid excess)",
        "Push hose firmly onto regulator outlet",
        "Secure with approved hose clamp",
        "Connect other end to appliance inlet",
        "Ensure all connections are tight and secure"
      ]
    },
    {
      step: 5,
      title: "Safety Testing",
      description: "Test all connections for leaks before use",
      requirements: [
        "Open cylinder valve slowly (quarter turn)",
        "Apply leak detection solution to all joints",
        "Check for bubbles indicating gas leaks",
        "If bubbles appear, close valve and retighten",
        "Test appliance operation at lowest setting first"
      ]
    }
  ];

  const maintenanceSchedule = [
    {
      frequency: "Monthly",
      tasks: [
        "Visual inspection of hoses for cracks or damage",
        "Check all connections for tightness",
        "Test leak detection on all joints",
        "Clean regulator and connections"
      ]
    },
    {
      frequency: "Every 6 Months",
      tasks: [
        "Professional inspection by certified technician",
        "Replace rubber washers and seals",
        "Check regulator pressure settings",
        "Inspect cylinder for dents or damage"
      ]
    },
    {
      frequency: "Annually",
      tasks: [
        "Replace LPG hoses (or sooner if damaged)",
        "Professional system pressure test",
        "Update safety equipment and detection devices",
        "Review and update emergency procedures"
      ]
    }
  ];

  return (
    <Layout>
      <PageHeader 
        title="LPG Installation Guide" 
        description="Professional installation guidelines for safe LPG system setup"
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-yellow-800 font-semibold">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Warning: LPG installation should only be performed by certified professionals
            </p>
          </div>

          {/* Installation Steps */}
          <div className="space-y-8 mb-12">
            {installationSteps.map((stepData) => (
              <div key={stepData.step} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mr-4">
                    {stepData.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{stepData.title}</h3>
                    <p className="text-gray-600">{stepData.description}</p>
                  </div>
                </div>
                <ul className="grid md:grid-cols-2 gap-2">
                  {stepData.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check text-green-500 mr-3 mt-1"></i>
                      <span className="text-sm text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Maintenance Schedule */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <i className="fas fa-calendar-alt text-primary mr-3"></i>
              Maintenance Schedule
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {maintenanceSchedule.map((schedule, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-primary mb-4">{schedule.frequency}</h3>
                  <ul className="space-y-2">
                    {schedule.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} className="flex items-start">
                        <i className="fas fa-chevron-right text-gray-400 mr-2 mt-1"></i>
                        <span className="text-sm text-gray-700">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Professional Service */}
          <div className="bg-primary text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Professional Installation Service</h2>
            <p className="mb-6">
              Our certified technicians ensure safe, compliant LPG system installation
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <i className="fas fa-certificate text-3xl mb-2"></i>
                <p className="font-semibold">ZERA Certified</p>
              </div>
              <div>
                <i className="fas fa-shield-alt text-3xl mb-2"></i>
                <p className="font-semibold">Safety Guaranteed</p>
              </div>
              <div>
                <i className="fas fa-clock text-3xl mb-2"></i>
                <p className="font-semibold">Same Day Service</p>
              </div>
            </div>
            <a 
              href="https://wa.me/263713314920?text=I need professional LPG installation service"
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold inline-flex items-center hover:bg-gray-100"
            >
              <i className="fab fa-whatsapp mr-2"></i>
              Book Installation Service
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}