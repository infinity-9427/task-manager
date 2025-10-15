export default function HomePage() {
  return (
    <div className="pt-6 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Task Manager</h1>
          <p className="text-xl text-gray-600 mb-8">
            Organize your tasks efficiently with our comprehensive data table featuring nested tasks, drag & drop, and advanced filtering
          </p>
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">Get Started</h2>
              <p className="text-gray-600 mb-4">
                Create, organize, and track your tasks with our intuitive interface
              </p>
              <a 
                href="/tasks" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Tasks
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
