'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, LogOut, ClipboardList, UserCircle } from 'lucide-react'
import { customerLogoutAction } from '@/actions/customer-auth'
import { Button } from '@/components/ui'

interface UserMenuProps {
  user: {
    email?: string
    fullName?: string | null
  } | null
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return (
      <Link href="/prihlasenie">
        <Button variant="outline" size="sm">
          <User className="mr-2 h-4 w-4" />
          Prihlásiť sa
        </Button>
      </Link>
    )
  }

  const displayName = user.fullName || user.email || 'Účet'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <UserCircle className="h-5 w-5 text-gray-500" />
        <span className="max-w-[120px] truncate">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2">
            <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
            {user.email && (
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            )}
          </div>

          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <User className="h-4 w-4" />
            Môj profil
          </Link>
          <Link
            href="/objednavky"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ClipboardList className="h-4 w-4" />
            Moje objednávky
          </Link>

          <div className="border-t border-gray-100">
            <form action={customerLogoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Odhlásiť sa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
