import { Layout } from "@/components/Layout";
import { useState } from "react";

export function StorageChecklist() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const checklistSections = [
    {
      title: "Location Requirements",
      icon: "fas fa-map-marker-alt",
      items: [
        { id: "outdoor", text: "Store cylinders outdoors or in well-ventilated areas only" },
        { id: "upright", text: "Keep cylinders upright and secure at all times" },
        { id: "level", text: "Place on level, stable, non-combustible surface" },
        { id: "distance", text: "Maintain minimum 3m distance from buildings/ignition sources" },
        { id: "access", text: "Ensure easy access for delivery and collection" }
      ]
    },
    {
      title: "Environmental Conditions",
      icon: "fas fa-thermometer-half",
      items: [
        { id: "shade", text: "Protect from direct sunlight and extreme temperatures" },
        { id: "dry", text: "Keep storage area dry and free from moisture" },
        { id: "ventilation", text: "Ensure adequate ventilation around storage area" },
        { id: "drainage", text: "Provide proper drainage to prevent water accumulation" },
        { id: "temperature", text: "Store in areas with stable temperature (below 50°C)" }
      ]
    },
    {
      title: "Safety Measures",
      icon: "fas fa-shield-alt",
      items: [
        { id: "signs", text: "Display 'No Smoking' and 'LPG Storage' warning signs" },
        { id: "extinguisher", text: "Keep appropriate fire extinguisher nearby" },
        { id: "separation", text: "Separate full and empty cylinders clearly" },
        { id: "secure", text: "Secure cylinders to prevent falling or rolling" },
        { id: "inspection", text: "Regular visual inspection for damage or leaks" }
      ]
    },
    {
      title: "Handling Procedures",
      icon: "fas fa-hand-paper",
      items: [
        { id: "lifting", text: "Use proper lifting techniques or cylinder trolley" },
        { id: "valve", text: "Keep cylinder valves closed when not in use" },
        { id: "caps", text: "Replace protective caps on valve outlets" },
        { id: "rotation", text: "Follow FIFO (First In, First Out) rotation system" },
        { id: "damaged", text: "Isolate damaged cylinders immediately" }
      ]
    },
    {
      title: "Documentation & Compliance",
      icon: "fas fa-clipboard-list",
      items: [
        { id: "records", text: "Maintain inventory records of all cylinders" },
        { id: "compliance", text: "Ensure ZERA compliance for commercial storage" },
        { id: "insurance", text: "Verify insurance coverage for LPG storage" },
        { id: "emergency", text: "Display emergency contact numbers clearly" },
        { id: "training", text: "Train all personnel in LPG safety procedures" }
      ]
    }
  ];

  const totalItems = checklistSections.reduce((sum, section) => sum + section.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const completionPercentage = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">LPG Storage Safety Checklist</h1>
            <p className="text-xl text-gray-600 mb-6">
              Comprehensive checklist for safe LPG cylinder storage
            </p>
            
            {/* Progress Bar */}
            <div className="bg-white rounded-lg p-6 shadow-md mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Completion Progress</span>
                <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-primary h-4 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {checkedCount} of {totalItems} items completed
              </p>
            </div>
          </div>

          {/* Checklist Sections */}
          <div className="space-y-6">
            {checklistSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <i className={`${section.icon} text-primary mr-3`}></i>
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <label 
                      key={item.id}
                      className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[item.id] || false}
                        onChange={() => handleCheck(item.id)}
                        className="w-5 h-5 text-primary border-2 border-gray-300 rounded focus:ring-primary"
                      />
                      <span className={`ml-3 ${checkedItems[item.id] ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Emergency Contact */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
              <i className="fas fa-exclamation-triangle mr-3"></i>
              Emergency Contacts
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <i className="fas fa-phone text-red-600 mr-3"></i>
                <div>
                  <p className="font-semibold text-red-800">Emergency Line</p>
                  <p className="text-red-700">0713314920</p>
                </div>
              </div>
              <div className="flex items-center">
                <i className="fab fa-whatsapp text-red-600 mr-3"></i>
                <div>
                  <p className="font-semibold text-red-800">WhatsApp Support</p>
                  <p className="text-red-700">0713314920</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center mt-8 space-x-4">
            <button
              onClick={() => setCheckedItems({})}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Reset Checklist
            </button>
            <button
              onClick={() => window.print()}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              <i className="fas fa-print mr-2"></i>
              Print Checklist
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}