import Link from 'next/link'
import { Button } from '@/components/ui'
import { Pizza } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Pizza className="h-16 w-16 text-gray-300" />
      <h1 className="mt-4 text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-lg text-gray-500">Stránka nenájdená</p>
      <Link href="/domov">
        <Button className="mt-6">Späť na hlavnú stránku</Button>
      </Link>
    </div>
  )
}
