'use client'

import { useActionState } from 'react'
import { resetPasswordAction } from '@/actions/customer-auth'
import type { AuthState } from '@/actions/customer-auth'
import { Button, Input, Label, Card, CardContent } from '@/components/ui'
import Link from 'next/link'
import { KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resetPasswordAction,
    null
  )

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <KeyRound className="mx-auto h-12 w-12 text-red-600" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Zabudnuté heslo</h1>
        <p className="mt-2 text-gray-500">Zadajte email a pošleme vám odkaz na reset hesla</p>
      </div>

      <Card>
        <CardContent>
          {state?.error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {state.success}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1"
              />
            </div>

            <Button type="submit" loading={pending} className="w-full" size="lg">
              Odoslať odkaz na reset
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/prihlasenie" className="font-medium text-red-600 hover:text-red-700">
              Späť na prihlásenie
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
