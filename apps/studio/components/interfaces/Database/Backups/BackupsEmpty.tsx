import { Info } from 'lucide-react'

const BackupsEmpty = () => {
  return (
    <div className="block w-full rounded border border-muted border-opacity-50 bg-gray-300 p-3">
      <div className="flex space-x-3">
        <Info size={20} strokeWidth={1.5} />
        <p className="text-sm">No backups created yet - check again tomorrow.</p>
      </div>
    </div>
  )
}

export default BackupsEmpty
