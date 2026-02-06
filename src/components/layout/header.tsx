import Link from 'next/link'
import { Pizza } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-red-600">
          <Pizza className="h-7 w-7" />
          <span>Pizza na Objednávku</span>
        </Link>
      </div>
    </header>
  )
}
