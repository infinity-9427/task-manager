import TaskList from '@/components/task-list'

export default function HomePage() {
  return (
    <div className="pt-6 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
        </div>
        
        <TaskList />
      </div>
    </div>
  )
}
