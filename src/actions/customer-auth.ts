'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import {
  registerSchema,
  customerLoginSchema,
  resetPasswordSchema,
  newPasswordSchema,
} from '@/lib/validators'

export type AuthState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string>
} | null

export async function customerRegisterAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    fullName: formData.get('fullName') as string,
    phone: formData.get('phone') as string,
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((err) => {
      const key = err.path[0]
      if (key != null) fieldErrors[String(key)] = err.message
    })
    return { fieldErrors }
  }

  const supabase = await createClient()
  const { data: signUpData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      return { error: 'Účet s týmto emailom už existuje' }
    }
    console.error('SignUp error:', error.message, error.status)
    return { error: `Nepodarilo sa vytvoriť účet: ${error.message}` }
  }

  // If email confirmation is enabled, user won't have a session yet
  const needsConfirmation = signUpData.user && !signUpData.session
  if (needsConfirmation) {
    return { success: 'Účet bol vytvorený. Skontrolujte si email a potvrďte registráciu.' }
  }

  // Ensure profile row exists (trigger may have failed)
  if (signUpData.user) {
    await supabase
      .from('customer_profiles')
      .upsert({
        id: signUpData.user.id,
        email: parsed.data.email,
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
      })
  }

  redirect('/domov')
}

export async function customerLoginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = customerLoginSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((err) => {
      const key = err.path[0]
      if (key != null) fieldErrors[String(key)] = err.message
    })
    return { fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Nesprávny email alebo heslo' }
  }

  const redirectTo = formData.get('redirect') as string
  redirect(redirectTo || '/domov')
}

export async function customerLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/domov')
}

export async function googleSignInAction() {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || headersList.get('x-forwarded-host') || ''

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/domov`,
    },
  })

  if (error || !data.url) {
    redirect('/prihlasenie?error=oauth')
  }

  redirect(data.url)
}

export async function resetPasswordAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get('email') as string,
  }

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || headersList.get('x-forwarded-host') || ''

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/nove-heslo`,
  })

  if (error) {
    return { error: 'Nepodarilo sa odoslať email na reset hesla' }
  }

  return { success: 'Email s odkazom na reset hesla bol odoslaný' }
}

export async function updatePasswordAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const parsed = newPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach((err) => {
      const key = err.path[0]
      if (key != null) fieldErrors[String(key)] = err.message
    })
    return { fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Nepodarilo sa zmeniť heslo' }
  }

  return { success: 'Heslo bolo úspešne zmenené' }
}
