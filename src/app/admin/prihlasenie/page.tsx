'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'
import { Button, Input, Label } from '@/components/ui'
import { Pizza } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Pizza className="mx-auto h-12 w-12 text-red-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Admin prihlásenie</h1>
          <p className="mt-2 text-sm text-gray-500">Prihláste sa do administrácie</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@example.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••"
              className="mt-1"
            />
          </div>

          <Button type="submit" loading={pending} className="w-full">
            Prihlásiť sa
          </Button>
        </form>
      </div>
    </div>
  )
}
