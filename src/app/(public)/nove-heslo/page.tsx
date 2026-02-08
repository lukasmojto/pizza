'use client'

import { useActionState } from 'react'
import { updatePasswordAction } from '@/actions/customer-auth'
import type { AuthState } from '@/actions/customer-auth'
import { Button, Input, Label, Card, CardContent } from '@/components/ui'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function NewPasswordPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePasswordAction,
    null
  )

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-red-600" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Nové heslo</h1>
        <p className="mt-2 text-gray-500">Zadajte nové heslo pre váš účet</p>
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
              {state.success}{' '}
              <Link href="/prihlasenie" className="font-medium underline">
                Prihláste sa
              </Link>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="password">Nové heslo</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                error={state?.fieldErrors?.password}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Potvrdenie hesla</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                error={state?.fieldErrors?.confirmPassword}
                className="mt-1"
              />
            </div>

            <Button type="submit" loading={pending} className="w-full" size="lg">
              Zmeniť heslo
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
