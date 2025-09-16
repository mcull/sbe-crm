
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Southeastern Beverage Education
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            CRM & Workflow Manager for WSET-Certified Wine & Spirits Education
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome to SBE CRM
            </h2>
            <p className="text-gray-600 mb-6">
              Manage candidates, courses, exams, and certifications for WSET wine and spirits education programs.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Candidates</h3>
                <p className="text-blue-600 text-sm">Manage student enrollment and tracking</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Courses</h3>
                <p className="text-green-600 text-sm">WSET Level 1-4 course management</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Exams</h3>
                <p className="text-purple-600 text-sm">Schedule and track exam results</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Certificates</h3>
                <p className="text-yellow-600 text-sm">Generate WSET-compliant certificates</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Project initialized successfully! Ready for development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
