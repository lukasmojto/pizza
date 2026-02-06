'use client'

import { Button } from '@/components/ui'
import { AlertCircle } from 'lucide-react'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="mt-4 text-xl font-bold text-gray-900">Niečo sa pokazilo</h2>
      <p className="mt-2 text-gray-500">Ospravedlňujeme sa za nepríjemnosti.</p>
      <Button onClick={reset} className="mt-6">
        Skúsiť znova
      </Button>
    </div>
  )
}
