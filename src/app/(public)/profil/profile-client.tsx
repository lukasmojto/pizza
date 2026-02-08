'use client'

import { useActionState } from 'react'
import { updateCustomerProfile } from '@/actions/customer-profile'
import type { ProfileState } from '@/actions/customer-profile'
import type { CustomerProfile } from '@/types'
import { Button, Input, Label, Card, CardContent, Textarea } from '@/components/ui'
import { User } from 'lucide-react'

interface ProfileClientProps {
  profile: CustomerProfile
}

export function ProfileClient({ profile }: ProfileClientProps) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateCustomerProfile,
    null
  )

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">Môj profil</h1>
        </div>
        <p className="mt-2 text-gray-500">Spravujte svoje osobné údaje</p>
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
                value={profile.email}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-400">Email nie je možné zmeniť</p>
            </div>
            <div>
              <Label htmlFor="fullName">Meno a priezvisko</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={profile.full_name || ''}
                autoComplete="name"
                error={state?.fieldErrors?.fullName}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefón</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone || ''}
                placeholder="+421..."
                autoComplete="tel"
                error={state?.fieldErrors?.phone}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="address">Adresa</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={profile.address || ''}
                placeholder="Adresa doručenia..."
                className="mt-1"
              />
            </div>

            <Button type="submit" loading={pending} className="w-full" size="lg">
              Uložiť zmeny
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
