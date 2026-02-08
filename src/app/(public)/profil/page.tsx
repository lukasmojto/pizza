import { getCustomerProfile } from '@/actions/customer-profile'
import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'

export default async function ProfilePage() {
  const profile = await getCustomerProfile()

  if (!profile) {
    redirect('/prihlasenie?redirect=/profil')
  }

  return <ProfileClient profile={profile} />
}
